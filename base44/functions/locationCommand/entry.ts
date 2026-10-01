import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { writeAudit } from '../../shared/audit.ts';

// Trail readings are written only by this endpoint: the browser asks, the server
// decides whether the caller actually owns an open shift before anything is stored.
const MANAGER_ROLES = new Set(['admin', 'operations_manager', 'supervisor']);

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
      const lat = Number(body.latitude);
      const lng = Number(body.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return fail('Valid coordinates are required');
      }
      if (!body.entry_id) return fail('Entry ID is required');

      const entry: any = await svc.entities.TimeEntry.get(body.entry_id).catch(() => null);
      if (!entry || entry.organization_id !== user.organization_id) return fail('Time entry not found', 404);
      if (entry.employee_email?.toLowerCase() !== email) return fail('Forbidden', 403);
      if (entry.status !== 'active') return fail('Time entry is not active', 409);

      const org: any = await svc.entities.Organization.get(user.organization_id).catch(() => null);
      if (!org?.settings?.capture_gps) return fail('Location capture is switched off for this workspace', 409);

      const employee: any = listItems(
        await svc.entities.Employee.filter(
          { organization_id: user.organization_id, email },
          { limit: 1 }
        )
      )[0];
      if (!employee?.location_consent) return fail('Location consent is required', 403);

      const accuracy = Number(body.accuracy);
      const point = await svc.entities.LocationPoint.create({
        organization_id: user.organization_id,
        employee_email: email,
        employee_name: employee.full_name || user.full_name || user.email,
        time_entry_id: entry.id,
        latitude: lat,
        longitude: lng,
        ...(Number.isFinite(accuracy) ? { accuracy } : {}),
        captured_at: new Date().toISOString(),
      });
      return Response.json({ point });
    }

    if (!isManager) return fail('Manager access required', 403);

    if (action === 'clear') {
      const targetEmail = String(body.employee_email || '').trim().toLowerCase();
      const from = String(body.from || '');
      const to = String(body.to || '');
      if (!targetEmail || !from || !to) return fail('Employee and date range are required');

      const result = await svc.entities.LocationPoint.deleteMany({
        organization_id: user.organization_id,
        employee_email: targetEmail,
        captured_at: { $gte: from, $lt: to },
      });
      await writeAudit(base44, {
        organization_id: user.organization_id,
        actor_email: user.email,
        actor_name: user.full_name,
        category: 'security',
        action: 'location_history_cleared',
        target: targetEmail,
        detail: `Location trail cleared for ${targetEmail} (${from.slice(0, 10)} to ${to.slice(0, 10)})`,
        metadata: { from, to },
      });
      return Response.json({ deleted: result?.deleted ?? result?.count ?? null });
    }

    return fail('Unknown action');
  } catch (error: any) {
    return fail(error?.message || 'Request failed', 500);
  }
}