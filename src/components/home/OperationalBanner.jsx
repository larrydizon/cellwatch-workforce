import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS = {
  trial: { label: 'Trial', className: 'bg-warning/10 text-warning', dot: 'bg-warning' },
  active: { label: 'Active', className: 'bg-success/10 text-success', dot: 'bg-success' },
  past_due: { label: 'Past due', className: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
  canceled: { label: 'Canceled', className: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
};

// Heavy top operational ticker: org status, trial countdown, upgrade CTA.
export default function OperationalBanner({ orgState }) {
  const { org, status, planName, trialDaysLeft, isReadOnly } = orgState;
  const s = STATUS[status] || STATUS.trial;

  const ticker = status === 'trial' && trialDaysLeft !== null
    ? trialDaysLeft > 0
      ? `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} remaining — ${planName} Trial`
      : 'Trial expired — upgrade to keep full access'
    : status === 'active'
      ? `${planName} subscription active`
      : status === 'past_due'
        ? 'Payment failed — update your card to restore full access'
        : 'Subscription canceled';

  return (
    <div className={cn(
      'rounded-lg border px-4 py-3 flex items-center justify-between gap-3 flex-wrap',
      isReadOnly ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card'
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={cn('status-pulse', s.className)}>
          <span className={cn('pulse-dot', s.dot)} />
          {s.label}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{org?.name || 'Your organization'}</p>
          <p className="text-xs text-muted-foreground truncate font-mono">{ticker}</p>
        </div>
      </div>
      <Link
        to="/billing"
        className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {isReadOnly ? <ShieldAlert className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
        Manage Subscription
      </Link>
    </div>
  );
}