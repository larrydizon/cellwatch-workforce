import React from 'react';
import { UserPlus, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import SeatGauge from './SeatGauge';

// Subscription & Seat Operations bento: current tier, seat utilization, inline add.
export default function SubscriptionSeatPanel({ orgState, onAddSeat }) {
  const { plan, planName, status, seatsUsed, seatLimit, seatsFull, canAddSeat, isReadOnly, org } = orgState;
  const priceLabel = plan.price === null ? 'Custom' : plan.price === 0 ? 'Free' : `$${plan.price}/mo`;

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Current tier</p>
          <p className="text-2xl font-bold font-heading mt-1">
            {planName} Plan
            {plan.price > 0 && <span className="text-base font-medium text-muted-foreground ml-2">{priceLabel}</span>}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {status === 'trial' ? 'On trial — ' : ''}
            {seatLimit === null ? 'Unlimited employees' : `Up to ${seatLimit} employees`}
          </p>
        </div>
        <SeatGauge used={seatsUsed} limit={seatLimit} />
      </div>

      <div className="mt-5 pt-5 border-t border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          {seatsFull ? (
            <p className="text-destructive font-medium">
              Seat limit reached — upgrade to add more employees.
            </p>
          ) : (
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">{seatLimit === null ? 'Unlimited' : seatLimit - seatsUsed}</span>
              {seatLimit === null ? ' seats' : ` seat${seatLimit - seatsUsed === 1 ? '' : 's'} available`}
            </p>
          )}
          {org?.current_period_end && (
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {org.cancel_at_period_end ? 'Ends' : 'Renews'} {new Date(org.current_period_end).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {seatsFull || isReadOnly ? (
            <Button asChild size="sm" className="gap-2">
              <Link to="/billing"><ArrowUpRight className="h-4 w-4" /> Upgrade</Link>
            </Button>
          ) : (
            <Button size="sm" className="gap-2" onClick={onAddSeat} disabled={!canAddSeat}>
              <UserPlus className="h-4 w-4" /> Add employee
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}