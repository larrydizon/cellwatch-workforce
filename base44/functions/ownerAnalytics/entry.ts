import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { requirePlatformOwner } from '../../shared/platformOwner.ts';
import { planMonthlyPrice } from '../../shared/plans.ts';

// Owner-only signup and revenue reporting across every tenant.
// requirePlatformOwner gates the whole endpoint, so an organization admin
// calling it directly gets a 403 no matter what the UI shows.

const DAY_MS = 86400000;
const TREND_DAYS = 30;

function dayKeys(days: number): string[] {
  const keys: string[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(start.getTime() - offset * DAY_MS);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    keys.push(`${date.getFullYear()}-${month}-${day}`);
  }
  return keys;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user: any = await base44.auth.me().catch(() => null);
    const denied = requirePlatformOwner(user);
    if (denied) return denied;

    const svc = base44.asServiceRole;
    const now = Date.now();
    const since = (days: number) => new Date(now - days * DAY_MS).toISOString();

    const [trendRows, total, last7, last30, previous30, planRows] = await Promise.all([
      svc.entities.Organization.aggregate({
        query: { created_date: { $gte: since(TREND_DAYS) } },
        dateBucket: { field: 'created_date', unit: 'day' },
      }),
      svc.entities.Organization.count({}),
      svc.entities.Organization.count({ created_date: { $gte: since(7) } }),
      svc.entities.Organization.count({ created_date: { $gte: since(30) } }),
      svc.entities.Organization.count({ created_date: { $gte: since(60), $lt: since(30) } }),
      svc.entities.Organization.aggregate({ query: {}, groupBy: ['plan', 'plan_status'] }),
    ]);

    // Signups per day, with the empty days filled so the chart stays continuous.
    const countsByDay = new Map<string, number>();
    for (const row of trendRows?.rows || []) {
      const key = String(row.created_date || '').slice(0, 10);
      if (key) countsByDay.set(key, Number(row.count) || 0);
    }
    const trend = dayKeys(TREND_DAYS).map((date) => ({ date, count: countsByDay.get(date) || 0 }));

    // Revenue from the plan and status actually stored on each organization.
    const planTotals = new Map<string, { plan: string; workspaces: number; mrr: number }>();
    const statusCounts: Record<string, number> = {};
    let mrr = 0;
    let payingWorkspaces = 0;
    let trialPipelineMrr = 0;
    let atRiskMrr = 0;

    for (const row of planRows?.rows || []) {
      const plan = String(row.plan || 'free');
      const status = String(row.plan_status || 'trial');
      const count = Number(row.count) || 0;
      const price = planMonthlyPrice(plan);

      statusCounts[status] = (statusCounts[status] || 0) + count;

      if (status === 'active') {
        mrr += price * count;
        payingWorkspaces += count;
        const entry = planTotals.get(plan) || { plan, workspaces: 0, mrr: 0 };
        entry.workspaces += count;
        entry.mrr += price * count;
        planTotals.set(plan, entry);
      }
      if (status === 'trial') trialPipelineMrr += price * count;
      if (status === 'past_due') atRiskMrr += price * count;
    }

    const growthPercent = previous30 > 0
      ? Math.round(((last30 - previous30) / previous30) * 100)
      : (last30 > 0 ? 100 : 0);

    return Response.json({
      generated_at: new Date().toISOString(),
      signups: {
        total,
        last_7_days: last7,
        last_30_days: last30,
        previous_30_days: previous30,
        growth_percent: growthPercent,
        trend,
      },
      revenue: {
        currency: 'USD',
        mrr,
        arr: mrr * 12,
        paying_workspaces: payingWorkspaces,
        arpa: payingWorkspaces > 0 ? Math.round((mrr / payingWorkspaces) * 100) / 100 : 0,
        trial_pipeline_mrr: trialPipelineMrr,
        at_risk_mrr: atRiskMrr,
        by_plan: [...planTotals.values()].sort((a, b) => b.mrr - a.mrr),
      },
      statuses: {
        trial: statusCounts.trial || 0,
        active: statusCounts.active || 0,
        past_due: statusCounts.past_due || 0,
        canceled: statusCounts.canceled || 0,
      },
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'Request failed' }, { status: 500 });
  }
}