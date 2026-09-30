import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const MANAGER_ROLES = new Set(['admin', 'operations_manager', 'supervisor']);
const UPDATE_FIELDS = new Set(['name', 'settings', 'member_emails', 'pending_invites']);

function sanitize(value: any, allowed: Set<string>) {
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value || {})) {
    if (allowed.has(key)) output[key] = item;
  }
  return output;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user: any = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Authentication required' }, { status: 401 });
    const body: any = await req.json().catch(() => ({}));
    const svc = base44.asServiceRole;

    if (body.action === 'claim_invite') {
      if (user.organization_id) return Response.json({ error: 'User already has a workspace' }, { status: 409 });
      const matches: any = await svc.entities.Organization.filter({ member_emails: user.email }, { limit: 10 });
      const organizations = Array.isArray(matches) ? matches : matches?.items || [];
      const organization = organizations.find((item: any) =>
        (item.member_emails || []).some((email: string) => email.toLowerCase() === user.email.toLowerCase())
      );
      if (!organization) return Response.json({ error: 'No invitation found' }, { status: 404 });
      const invite = (organization.pending_invites || []).find(
        (item: any) => item.email?.toLowerCase() === user.email.toLowerCase(),
      ) || null;
      return Response.json({ organization: { id: organization.id, name: organization.name }, invite });
    }

    if (body.action === 'create_workspace') {
      if (user.organization_id) return Response.json({ error: 'User already has a workspace' }, { status: 409 });
      const name = String(body.name || '').trim().slice(0, 120);
      if (!name) return Response.json({ error: 'Organization name is required' }, { status: 400 });
      const organization = await svc.entities.Organization.create({
        name,
        owner_email: user.email,
        member_emails: [user.email],
        pending_invites: [],
        plan: 'free',
        plan_status: 'trial',
        seat_limit: 5,
        trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
      });
      return Response.json({ organization });
    }

    if (!user.organization_id) return Response.json({ error: 'Organization required' }, { status: 400 });
    const organization: any = await svc.entities.Organization.get(user.organization_id);
    const owner = organization?.owner_email?.toLowerCase();
    const email = user.email.toLowerCase();
    const isMember = owner === email || (organization?.member_emails || []).map((item: string) => item.toLowerCase()).includes(email);
    if (!organization || !isMember) return Response.json({ error: 'Organization not found' }, { status: 404 });
    if (owner !== email && !MANAGER_ROLES.has(user.role)) {
      return Response.json({ error: 'Manager access required' }, { status: 403 });
    }

    const changes: any = sanitize(body.changes, UPDATE_FIELDS);
    if (changes.member_emails) {
      changes.member_emails = [...new Set(
        changes.member_emails.map((item: unknown) => String(item).trim().toLowerCase()).filter(Boolean)
      )];
      if (!changes.member_emails.includes(owner)) changes.member_emails.push(owner);
    }
    if (changes.pending_invites) {
      changes.pending_invites = changes.pending_invites.slice(0, 500).map((invite: any) => ({
        email: String(invite.email || '').trim().toLowerCase(),
        full_name: String(invite.full_name || '').slice(0, 120),
        role: invite.role === 'admin' ? 'admin' : 'user',
        user_level: String(invite.user_level || '').slice(0, 80),
        phone: String(invite.phone || '').slice(0, 40),
        position: String(invite.position || '').slice(0, 80),
        job_title: String(invite.job_title || '').slice(0, 120),
      })).filter((invite: any) => invite.email);
    }
    const updated = await svc.entities.Organization.update(organization.id, changes);
    return Response.json({ organization: updated });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'Request failed' }, { status: 500 });
  }
}
