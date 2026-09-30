import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const MANAGER_ROLES = new Set(['admin', 'operations_manager', 'supervisor']);
const SELF_FIELDS = new Set([
  'full_name', 'phone', 'address', 'job_title', 'position', 'team', 'skills',
  'emergency_contact_name', 'emergency_contact_phone',
  'emergency_contact_relationship', 'photos', 'custom_fields',
]);
const MANAGER_FIELDS = new Set([
  ...SELF_FIELDS, 'user_id', 'role', 'user_level', 'employment_type',
  'contract_type', 'ird_number', 'hourly_rate', 'overtime_multiplier',
  'daily_report_required', 'is_active',
]);
const USER_FIELDS = new Set([
  'full_name', 'phone', 'address', 'job_title', 'position', 'team', 'skills',
  'emergency_contact_name', 'emergency_contact_phone',
  'emergency_contact_relationship', 'photos', 'custom_fields', 'role',
  'user_level', 'employment_type', 'contract_type', 'ird_number', 'hourly_rate',
  'overtime_multiplier',
]);

function cleanFields(source: any, allowed: Set<string>) {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source || {})) {
    if (allowed.has(key)) result[key] = value;
  }
  return result;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user: any = await base44.auth.me().catch(() => null);
    if (!user?.email || !user?.organization_id) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body: any = await req.json().catch(() => ({}));
    const isManager = MANAGER_ROLES.has(user.role);
    const requestedEmail = String(body.email || user.email).trim().toLowerCase();
    if (!isManager && requestedEmail !== user.email.toLowerCase()) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fields = cleanFields(body.fields, isManager ? MANAGER_FIELDS : SELF_FIELDS);
    if (!isManager) fields.user_id = user.id;
    const svc = base44.asServiceRole;
    const found: any = await svc.entities.Employee.filter({
      organization_id: user.organization_id,
      email: requestedEmail,
    }, { limit: 1 });
    const existing = (Array.isArray(found) ? found : found?.items || [])[0];
    const payload = {
      ...fields,
      organization_id: user.organization_id,
      email: requestedEmail,
      full_name: String(fields.full_name || existing?.full_name || requestedEmail),
    };
    const entry = existing
      ? await svc.entities.Employee.update(existing.id, payload)
      : await svc.entities.Employee.create(payload);
    if (isManager && existing?.user_id) {
      await svc.entities.User.update(existing.user_id, cleanFields(fields, USER_FIELDS));
    }
    return Response.json({ entry });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'Request failed' }, { status: 500 });
  }
}
