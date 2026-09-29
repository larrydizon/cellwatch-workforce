import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PLANS } from '@/lib/plans';
import { orgSettings } from '@/lib/orgSettings';

// Days of read-only grace after a trial lapses before admin access is restricted.
export const TRIAL_GRACE_DAYS = 3;

export default function useOrganization(user) {
  const orgId = user?.organization_id;

  const { data: org, isLoading } = useQuery({
    queryKey: ['my-org', orgId],
    queryFn: () => base44.entities.Organization.get(orgId),
    enabled: !!orgId,
  });

  const { data: seatCount = 0 } = useQuery({
    queryKey: ['org-seat-count', orgId],
    queryFn: () => base44.entities.Employee.count({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const plan = PLANS.find((p) => p.key === org?.plan) || PLANS[0];
  const seatLimit = org?.seat_limit ?? plan.seats ?? 5;
  const status = org?.plan_status || 'trial';

  const now = Date.now();
  const trialEnds = org?.trial_ends_at ? new Date(org.trial_ends_at).getTime() : null;
  const trialDaysLeft = trialEnds ? Math.ceil((trialEnds - now) / 86400000) : null;
  const graceEnds = trialEnds ? trialEnds + TRIAL_GRACE_DAYS * 86400000 : null;
  const trialExpired = trialEnds !== null && now > trialEnds;

  // Mixed enforcement: seat overage is hard-blocked, a lapsed trial drops
  // owners/admins to read-only after the grace window.
  const isReadOnly =
    (status === 'trial' && graceEnds !== null && now > graceEnds) ||
    status === 'past_due' ||
    status === 'canceled';

  const seatsUsed = seatCount;
  const seatsFull = seatLimit !== null && seatsUsed >= seatLimit;

  return {
    org,
    isLoading,
    settings: orgSettings(org),
    plan,
    planName: plan.name,
    status,
    seatLimit,
    seatsUsed,
    seatsFull,
    seatsLeft: seatLimit === null ? null : Math.max(0, seatLimit - seatsUsed),
    trialDaysLeft,
    trialExpired,
    isReadOnly,
    canAddSeat: !seatsFull && !isReadOnly,
  };
}