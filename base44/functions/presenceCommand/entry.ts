import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { writeAudit } from '../../shared/audit.ts';

// Office / remote presence checks. The server is the only writer: it confirms the
// caller owns an open shift, is flagged as an office/remote worker, has consented,
// and that the matching workspace switch is on before a check is stored.
const MANAGER_ROLES = new Set(['admin', 'operations_manager', 'supervisor']);
const CHECK_TYPES = new Set(['snapshot', 'location', 'missed']);

function fail(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

function listItems(value: any): any[] {
  return Array.isArray(value) ? value : value?.items || [];
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user: any = await base44.auth.me().catch(() => null);
    if (!user?.email || !user?.organization_id) return fail('Authentication required', 401);

    const body: any = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const isManager = MANAGER_ROLES.has(user.role);
    const svc = base44.asServiceRole;
    const email = user.email.toLowerCase();

    if (action === 'record') {
      if (!body.entry_id) return fail('Entry ID is required');
      const entry: any = await svc.entities.TimeEntry.get(body.entry_id).catch(() => null);
      if (!entry || entry.organization_id !== user.organization_id) return fail('Time entry not found', 404);
      if (entry.employee_email?.toLowerCase() !== email) return fail('Forbidden', 403);
      if (entry.status !== 'active') return fail('Time entry is not active', 409);

      const employee: any = listItems(
        await svc.entities.Employee.filter(
          { organization_id: user.organization_id, email },
          { limit: 1 }
        )
      )[0];
      if (!employee?.office_remote) return fail('Presence checks are not enabled for this employee', 409);
      if (!employee?.presence_consent) return fail('Presence-check consent is required', 403);

      const org: any = await svc.entities.Organization.get(user.organization_id).catch(() => null);
      const settings = org?.settings || {};
      if (!settings.presence_checks_enabled) {
        return fail('Presence checks are switched off for this workspace', 409);
      }

      const checkType = CHECK_TYPES.has(body.check_type) ? body.check_type : 'missed';
      if (checkType === 'snapshot' && !settings.presence_camera) {
        return fail('Camera checks are switched off for this workspace', 409);
      }
      if (checkType === 'location' && !settings.presence_location) {
        return fail('Location checks are switched off for this workspace', 409);
      }

      const lat = Number(body.latitude);
      const lng = Number(body.longitude);
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
      const accuracy = Number(body.accuracy);
      const deviceOn = !!settings.presence_device;

      const check = await svc.entities.PresenceCheck.create({
        organization_id: user.organization_id,
        employee_email: email,
        employee_name: employee.full_name || user.full_name || user.email,
        time_entry_id: entry.id,
        check_type: checkType,
        captured_at: new Date().toISOString(),
        ...(hasCoords ? { latitude: lat, longitude: lng } : {}),
        ...(hasCoords && Number.isFinite(accuracy) ? { accuracy } : {}),
        ...(deviceOn && body.device_id ? { device_id: String(body.device_id).slice(0, 120) } : {}),
        ...(deviceOn && body.device_label ? { device_label: String(body.device_label).slice(0, 120) } : {}),
        ...(checkType === 'snapshot' && body.file_uri ? { file_uri: String(body.file_uri) } : {}),
        ...(body.note ? { note: String(body.note).slice(0, 300) } : {}),
      });
      return Response.json({ check });
    }

    if (action === 'sign') {
      const uris: string[] = Array.isArray(body.file_uris)
        ? body.file_uris.filter((uri: any) => typeof uri === 'string').slice(0, 50)
        : [];
      if (!uris.length) return Response.json({ urls: {} });

      const checks = listItems(
        await svc.entities.PresenceCheck.filter(
          { organization_id: user.organization_id, file_uri: { $in: uris } },
          { limit: 50 }
        )
      );
      const allowed = new Set(
        checks
          .filter((c: any) => isManager || c.employee_email?.toLowerCase() === email)
          .map((c: any) => c.file_uri)
      );

      const urls: Record<string, string> = {};
      for (const uri of uris) {
        if (!allowed.has(uri)) continue;
        const signed = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 600 });
        if (signed?.signed_url) urls[uri] = signed.signed_url;
      }
      return Response.json({ urls });
    }

    if (!isManager) return fail('Manager access required', 403);

    if (action === 'clear') {
      const targetEmail = String(body.employee_email || '').trim().toLowerCase();
      const from = String(body.from || '');
      const to = String(body.to || '');
      if (!targetEmail || !from || !to) return fail('Employee and date range are required');

      const result = await svc.entities.PresenceCheck.deleteMany({
        organization_id: user.organization_id,
        employee_email: targetEmail,
        captured_at: { $gte: from, $lt: to },
      });
      await writeAudit(base44, {
        organization_id: user.organization_id,
        actor_email: user.email,
        actor_name: user.full_name,
        category: 'security',
        action: 'presence_history_cleared',
        target: targetEmail,
        detail: `Presence checks cleared for ${targetEmail} (${from.slice(0, 10)} to ${to.slice(0, 10)})`,
        metadata: { from, to },
      });
      return Response.json({ deleted: result?.deleted ?? result?.count ?? null });
    }

    return fail('Unknown action');
  } catch (error: any) {
    return fail(error?.message || 'Request failed', 500);
  }
}