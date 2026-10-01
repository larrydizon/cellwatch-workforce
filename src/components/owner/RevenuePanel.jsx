import React from 'react';
import { DollarSign, TrendingUp, Users, Receipt, Clock, AlertTriangle } from 'lucide-react';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function tiles(revenue) {
  return [
    { label: 'MRR', value: money.format(revenue.mrr), icon: DollarSign, tone: 'text-success' },
    { label: 'ARR', value: money.format(revenue.arr), icon: TrendingUp, tone: 'text-success' },
    { label: 'Paying workspaces', value: revenue.paying_workspaces, icon: Users },
    { label: 'Avg revenue / account', value: money.format(revenue.arpa), icon: Receipt },
  ];
}

export default function RevenuePanel({ revenue }) {
  const maxMrr = revenue?.by_plan?.length ? Math.max(...revenue.by_plan.map((row) => row.mrr)) : 0;

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-heading text-sm font-semibold">Revenue</h2>
        <p className="text-xs text-muted-foreground">Recurring value across all tenant organizations</p>
      </div>

      {!revenue ? (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[76px] rounded-lg bg-muted/40 animate-pulse" />
            ))}
          </div>
          <div className="h-32 rounded-lg bg-muted/40 animate-pulse" />
        </div>
      ) : (
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {tiles(revenue).map((tile) => (
              <div key={tile.label} className="rounded-lg border border-border bg-background/40 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tile.label}</p>
                  <tile.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </div>
                <p className={`text-xl font-bold tracking-tight mt-1.5 ${tile.tone || ''}`}>{tile.value}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-background/40 px-4 py-3">
              <Clock className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Trial pipeline</p>
                <p className="text-sm font-semibold mt-0.5">{money.format(revenue.trial_pipeline_mrr)} / month</p>
                <p className="text-xs text-muted-foreground">If every active trial converts at list price</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border bg-background/40 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">At risk</p>
                <p className="text-sm font-semibold mt-0.5">{money.format(revenue.at_risk_mrr)} / month</p>
                <p className="text-xs text-muted-foreground">Past due workspaces that have not paid</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Revenue by plan</p>
            {revenue.by_plan.length === 0 ? (
              <p className="text-sm text-muted-foreground">No paying workspaces yet.</p>
            ) : (
              <div className="space-y-3">
                {revenue.by_plan.map((row) => (
                  <div key={row.plan}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium capitalize">{row.plan}</span>
                      <span className="text-muted-foreground">
                        {row.workspaces} {row.workspaces === 1 ? 'workspace' : 'workspaces'} · {money.format(row.mrr)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${maxMrr > 0 ? Math.max(4, (row.mrr / maxMrr) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}