// Workspace administrator bootstrap.
//
// The person who creates a workspace becomes its first administrator, and every
// workspace starts with the standard permission levels already in place. This is
// shared by workspace creation and by the repair that restores administrator
// access on an older workspace whose owner was never promoted.

// Mirrors DEFAULT_LEVELS in src/lib/employeeProfile.js
export const DEFAULT_LEVELS = [
  { label: 'Administrator', value: 'administrator', is_admin: true },
  { label: 'Operations Manager', value: 'operations_manager', is_admin: true },
  { label: 'Supervisor', value: 'supervisor', is_admin: true },
  { label: 'Office Manager', value: 'office_manager', is_admin: false },
  { label: 'Office Worker', value: 'office_worker', is_admin: false },
  { label: 'Field Technician', value: 'technician', is_admin: false },
  { label: 'Casual / Subcontractor', value: 'casual_worker', is_admin: false },
  { label: 'Client Viewer', value: 'client_viewer', is_admin: false },
  { label: 'Standard User', value: 'standard_user', is_admin: false },
];

export const ADMIN_LEVEL = 'administrator';

function listItems(value: any): any[] {
  return Array.isArray(value) ? value : value?.items || [];
}

// Safe to run more than once: only levels the workspace is missing are created,
// so a workspace never ends up with duplicate permission levels.
export async function seedDefaultLevels(svc: any, organizationId: string) {
  if (!organizationId) return [];
  const existing = listItems(
    await svc.entities.UserLevel.filter({ organization_id: organizationId }, { limit: 200 }),
  );
  const known = new Set(existing.map((level: any) => level.value));
  const missing = DEFAULT_LEVELS.filter((level) => !known.has(level.value));
  if (!missing.length) return existing;
  const created = listItems(
    await svc.entities.UserLevel.bulkCreate(
      missing.map((level) => ({ ...level, organization_id: organizationId })),
    ),
  );
  return [...existing, ...created];
}

// Grants administrator status without touching any other profile detail.
export async function promoteWorkspaceAdmin(
  svc: any,
  organizationId: string,
  email: string,
  userId?: string,
) {
  const target = String(email || '').trim().toLowerCase();
  if (!target || !organizationId) return null;

  const entry = listItems(
    await svc.entities.Employee.filter({ organization_id: organizationId, email: target }, { limit: 1 }),
  )[0];
  const accountId = userId || entry?.user_id;

  if (accountId) {
    await svc.entities.User.update(accountId, { role: 'admin', user_level: ADMIN_LEVEL });
  }
  if (entry) {
    await svc.entities.Employee.update(entry.id, { role: 'admin', user_level: ADMIN_LEVEL });
  }

  return { email: target, promoted: true };
}