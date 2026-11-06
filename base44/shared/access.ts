// Shared subscription enforcement, so every server command refuses writes on
// exactly the workspaces the app already shows as read-only. Mirrors
// src/hooks/useOrganization.js: a lapsed trial keeps a grace window, and a
// workspace that is past due or cancelled is read-only immediately.

export const TRIAL_GRACE_DAYS = 3;

export function isWorkspaceReadOnly(org: any): boolean {
  if (!org) return false;
  const status = org.plan_status || 'trial';
  if (status === 'past_due' || status === 'canceled') return true;
  if (status === 'trial' && org.trial_ends_at) {
    const ends = new Date(org.trial_ends_at).getTime();
    if (!Number.isFinite(ends)) return false;
    return Date.now() > ends + TRIAL_GRACE_DAYS * 86400000;
  }
  return false;
}

// null means unlimited (or unset), so callers must handle it separately.
export function seatLimitFor(org: any): number | null {
  const limit = org?.seat_limit;
  return typeof limit === 'number' ? limit : null;
}