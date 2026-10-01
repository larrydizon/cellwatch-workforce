import React from 'react';
import { Building2, CheckCircle2, Clock, AlertTriangle, XCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

function cards(metrics) {
  return [
    { label: 'Workspaces', value: metrics.total, icon: Building2, tone: 'text-primary bg-primary/10' },
    { label: 'Active', value: metrics.active, icon: CheckCircle2, tone: 'text-success bg-success/10' },
    {
      label: 'On trial',
      value: metrics.trial,
      icon: Clock,
      tone: 'text-warning bg-warning/10',
      hint: metrics.trials_ending_soon ? `${metrics.trials_ending_soon} ending within 7 days` : null,
    },
    { label: 'Past due', value: metrics.past_due, icon: AlertTriangle, tone: 'text-destructive bg-destructive/10' },
    { label: 'Canceled', value: metrics.canceled, icon: XCircle, tone: 'text-muted-foreground bg-muted' },
    { label: 'Seats in use', value: metrics.seats_in_use, icon: Users, tone: 'text-primary bg-primary/10' },
  ];
}

export default function OwnerMetrics({ metrics }) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-[92px] rounded-xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards(metrics).map((card) => (
        <div key={card.label} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</p>
              <p className="text-2xl font-bold tracking-tight mt-1.5">{card.value}</p>
              {card.hint && <p className="text-xs text-warning mt-1">{card.hint}</p>}
            </div>
            <div className={cn('p-2 rounded-lg shrink-0', card.tone)}>
              <card.icon className="h-4 w-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}