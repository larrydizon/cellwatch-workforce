import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { requirePlatformOwner } from '../../shared/platformOwner.ts';

// Owner-only console data. Every request is gated by requirePlatformOwner, so an
// organization admin calling this endpoint directly gets a 403 regardless of UI.

const STATUSES = new Set(['trial', 'active', 'past_due', 'canceled']);
const TRIAL_SOON_DAYS = 7;
const TRIAL_RESET_DAYS = 14;
const DAY_MS = 86400000;

function listItems(value: any): any[] {
  return Array.isArray(value) ? value : value?.items || [];
}

function toTime(value: any): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Filtering happens in the database, not over the loaded page.
function buildQuery(filter: string, search: string) {
  const query: any = {};
  if (filter === 'ending_soon') {
    query.plan_status = 'trial';
    query.trial_ends_at = { $lte: new Date(Date.now() + TRIAL_SOON_DAYS * DAY_MS).toISOString() };
  } else if (STATUSES.has(filter)) {
    query.plan_status = filter;
  }
  const term = search.trim();
  if (term) {
    const pattern = escapeRegex(term);
    query.$or = [
      { name: { $regex: pattern, $options: 'i' } },
      { owner_email: { $regex: pattern, $options: 'i' } },
    ];
  }
  return query;
}

function tenantView(organization: any, seatsUsed: number) {
  const trialEnds = toTime(organization.trial_ends_at);
  const seatLimit = organization.seat_limit ?? null;
  return {
    id: organization.id,
    name: organization.name || 'Untitled workspace',
    owner_email: organization.owner_email || '',
    plan: organization.plan || 'free',
    plan_status: organization.plan_status || 'trial',
    trial_ends_at: organization.trial_ends_at || null,
    trial_days_left: trialEnds === null ? null : Math.ceil((trialEnds - Date.now()) / DAY_MS),
    current_period_end: organization.current_period_end || null,
    cancel_at_period_end: !!organization.cancel_at_period_end,
    seat_limit: seatLimit,
    seats_used: seatsUsed,
    seats_over: seatLimit !== null && seatsUsed > seatLimit,
    member_count: (organization.member_emails || []).length,
    created_date: organization.created_date || null,
  };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user: any = await base44.auth.me().catch(() => null);
    const denied = requirePlatformOwner(user);
    if (denied) return denied;

    const svc = base44.asServiceRole;
    const body: any = await req.json().catch(() => ({}));
    const action = String(body.action || 'list');

    if (action === 'extend_trial') {
      const organizationId = String(body.organization_id || '');
      if (!organizationId) return Response.json({ error: 'organization_id is required' }, { status: 400 });
      const days = Math.min(Math.max(Math.round(Number(body.days) || 0), 1), 365);
      const organization: any = await svc.entities.Organization.get(organizationId);
      if (!organization) return Response.json({ error: 'Workspace not found' }, { status: 404 });
      // Extending adds to the remaining time rather than replacing it.
      const current = toTime(organization.trial_ends_at);
      const from = current !== null && current > Date.now() ? current : Date.now();
      const updated = await svc.entities.Organization.update(organizationId, {
        plan_status: 'trial',
        trial_ends_at: new Date(from + days * DAY_MS).toISOString(),
      });
      return Response.json({ organization: updated });
    }

    if (action === 'set_status') {
      const organizationId = String(body.organization_id || '');
      if (!organizationId) return Response.json({ error: 'organization_id is required' }, { status: 400 });
      const status = String(body.status || '');
      if (!STATUSES.has(status)) return Response.json({ error: 'Unknown status' }, { status: 400 });
      const changes: any = { plan_status: status };
      if (status === 'trial') changes.trial_ends_at = new Date(Date.now() + TRIAL_RESET_DAYS * DAY_MS).toISOString();
      const updated = await svc.entities.Organization.update(organizationId, changes);
      return Response.json({ organization: updated });
    }

    const filter = String(body.filter || 'all');
    const search = String(body.search || '').slice(0, 120);

    const [statusRows, seatsInUse, trialsEndingSoon, seatRows, organizations] = await Promise.all([
      svc.entities.Organization.aggregate({ query: {}, groupBy: 'plan_status' }),
      svc.entities.Employee.count({}),
      svc.entities.Organization.count({
        plan_status: 'trial',
        trial_ends_at: { $lte: new Date(Date.now() + TRIAL_SOON_DAYS * DAY_MS).toISOString() },
      }),
      svc.entities.Employee.aggregate({ query: {}, groupBy: 'organization_id' }),
      svc.entities.Organization.filter(buildQuery(filter, search), { sort: '-created_date', limit: 500 }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const row of statusRows?.rows || []) {
      statusCounts[String(row.plan_status || 'trial')] = Number(row.count) || 0;
    }

    const seatCounts = new Map<string, number>();
    for (const row of seatRows?.rows || []) {
      if (row?.organization_id) seatCounts.set(String(row.organization_id), Number(row.count) || 0);
    }

    const tenants = listItems(organizations).map((organization: any) =>
      tenantView(organization, seatCounts.get(organization.id) || 0));

    return Response.json({
      generated_at: new Date().toISOString(),
      metrics: {
        total: Object.values(statusCounts).reduce((sum, value) => sum + value, 0),
        active: statusCounts.active || 0,
        trial: statusCounts.trial || 0,
        past_due: statusCounts.past_due || 0,
        canceled: statusCounts.canceled || 0,
        trials_ending_soon: trialsEndingSoon,
        seats_in_use: seatsInUse,
      },
      tenants,
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'Request failed' }, { status: 500 });
  }
}