import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

// Slim alert shown across the app only when the organization needs attention:
// trial about to lapse, subscription lapsed (read-only), or seats full.
export default function PlanStatusBanner({ orgState }) {
  const { status, trialDaysLeft, trialExpired, isReadOnly, seatsFull, seatLimit, planName } = orgState;

  let tone = null;
  let message = null;

  if (isReadOnly) {
    tone = 'destructive';
    message = status === 'past_due'
      ? 'Your last payment failed — the workspace is read-only until billing is updated.'
      : 'Your trial has ended — the workspace is read-only until you choose a plan.';
  } else if (status === 'trial' && trialDaysLeft !== null && trialDaysLeft <= 7) {
    tone = 'warning';
    message = trialExpired
      ? `Your ${planName} trial has ended.`
      : `Your ${planName} trial ends in ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'}.`;
  } else if (seatsFull) {
    tone = 'warning';
    message = `All ${seatLimit} seats are in use — upgrade to add more employees.`;
  }

  if (!message) return null;

  const Icon = tone === 'destructive' ? ShieldAlert : AlertTriangle;

  return (
    <Link
      to="/billing"
      className={cn(
        'mb-4 flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition-colors',
        tone === 'destructive'
          ? 'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15'
          : 'border-warning/40 bg-warning/10 text-warning hover:bg-warning/15'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 font-medium">{message}</span>
      <span className="font-semibold underline underline-offset-2">Manage plan</span>
    </Link>
  );
}