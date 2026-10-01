// Platform-owner identity for Cellwatch.
//
// The owner is the person running Cellwatch itself — not an organization admin.
// This is deliberately NOT a stored User.role value: the role is resolved from a
// server-side secret allowlist (PLATFORM_OWNER_EMAILS), so there is nothing in
// the database a customer could edit to grant themselves owner access, and an
// organization admin cannot assign it to anyone.
//
// Owner-only backend functions must call requirePlatformOwner() before touching
// owner-scoped data — never rely on hiding UI.

import { secrets } from 'base44:runtime';

export const PLATFORM_OWNER_ROLE = 'platform_owner';

// Email addresses allowed to hold the platform-owner role.
export function platformOwnerEmails(): string[] {
  let raw = '';
  try {
    raw = secrets.get('PLATFORM_OWNER_EMAILS') || '';
  } catch {
    raw = '';
  }
  return String(raw)
    .split(',')
    .map((email: string) => email.trim().toLowerCase())
    .filter(Boolean);
}

// True once at least one owner email has been configured.
export function platformOwnerConfigured(): boolean {
  return platformOwnerEmails().length > 0;
}

// True only for the owner's own account.
export function isPlatformOwner(user: any): boolean {
  const email = String(user?.email || '').trim().toLowerCase();
  if (!email) return false;
  return platformOwnerEmails().includes(email);
}

// The role a user acts as. platform_owner takes precedence over the
// organization role (admin, operations_manager, supervisor, user).
export function effectiveRole(user: any): string {
  return isPlatformOwner(user) ? PLATFORM_OWNER_ROLE : String(user?.role || 'user');
}

// Guard for owner-only endpoints. Returns the Response to send back when the
// caller is not the owner, or null when they are:
//
//   const denied = requirePlatformOwner(user);
//   if (denied) return denied;
export function requirePlatformOwner(user: any): Response | null {
  if (!user?.email) return Response.json({ error: 'Authentication required' }, { status: 401 });
  if (!isPlatformOwner(user)) {
    return Response.json({ error: 'Platform owner access required' }, { status: 403 });
  }
  return null;
}