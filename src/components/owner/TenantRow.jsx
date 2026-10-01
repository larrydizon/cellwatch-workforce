import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusStyles = {
  trial: 'bg-warning/10 text-warning',
  active: 'bg-success/10 text-success',
  past_due: 'bg-destructive/10 text-destructive',
  canceled: 'bg-muted text-muted-foreground',
};

function trialLabel(days) {
  if (days === null) return '—';
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Ends today';
  return `${days} days left`;
}

export default function TenantRow({ tenant, onManage }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-accent/40 transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm font-medium">{tenant.name}</p>
        <p className="text-xs text-muted-foreground">{tenant.owner_email || 'No owner on record'}</p>
      </td>
      <td className="px-4 py-3 text-sm capitalize">{tenant.plan}</td>
      <td className="px-4 py-3">
        <Badge className={cn('capitalize', statusStyles[tenant.plan_status] || '')}>{tenant.plan_status}</Badge>
      </td>
      <td className="px-4 py-3 text-sm">
        {tenant.plan_status === 'trial' ? (
          <span className={cn(tenant.trial_days_left !== null && tenant.trial_days_left < 0 && 'text-destructive')}>
            {trialLabel(tenant.trial_days_left)}
          </span>
        ) : tenant.cancel_at_period_end ? (
          <span className="text-warning">Ends at period end</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm">
        <span className={cn(tenant.seats_over && 'text-destructive font-medium')}>
          {tenant.seats_used}
          {tenant.seat_limit !== null ? ` / ${tenant.seat_limit}` : ' / unlimited'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => onManage(tenant)}>
          <Settings2 className="h-4 w-4" />
          Manage
        </Button>
      </td>
    </tr>
  );
}