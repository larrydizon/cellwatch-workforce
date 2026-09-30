import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { PLANS } from '@/lib/plans';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PlanCard from '@/components/billing/PlanCard';
import { openStripePage } from '@/lib/stripeCheckout';

const planLabels = { free: 'Free', starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' };
const statusColors = {
  trial: 'bg-warning/10 text-warning',
  active: 'bg-success/10 text-success',
  past_due: 'bg-destructive/10 text-destructive',
  canceled: 'bg-muted text-muted-foreground',
};

export default function Billing() {
  const { user } = useOutletContext();
  const queryClient = useQueryClient();
  const [subscribing, setSubscribing] = useState(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const { data: org } = useQuery({
    queryKey: ['my-org', user?.organization_id],
    queryFn: () => base44.entities.Organization.get(user.organization_id),
    enabled: !!user?.organization_id,
  });

  // Returning from Checkout or from the billing portal: the webhook is the
  // source of truth, so re-read the organization and clear the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const fromPortal = params.get('portal');

    if (sessionId) {
      base44.functions.invoke('confirmSubscription', { sessionId }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['my-org'] });
        toast.success('Subscription activated!');
        window.history.replaceState({}, '', '/billing');
      }).catch(() => toast.error('Could not confirm subscription'));
      return;
    }

    if (fromPortal) {
      queryClient.invalidateQueries({ queryKey: ['my-org'] });
      toast.success('Billing updated');
      window.history.replaceState({}, '', '/billing');
    }
  }, []);

  const handleSubscribe = async (plan) => {
    if (!plan.checkout) {
      toast.error(plan.price === null ? 'Contact sales for an enterprise plan' : 'This plan does not require checkout');
      return;
    }
    setSubscribing(plan.key);
    try {
      await openStripePage(async () => {
        const res = await base44.functions.invoke('createCheckoutSession', {
          plan: plan.key,
          returnUrl: window.location.origin,
        });
        return res.data.url;
      });
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Failed to start checkout');
    }
    setSubscribing(null);
  };

  // Card, invoices and cancellation all live in the provider's hosted portal.
  const handleManageBilling = async () => {
    setOpeningPortal(true);
    try {
      await openStripePage(async () => {
        const res = await base44.functions.invoke('createPortalSession', { returnUrl: window.location.origin });
        return res.data.url;
      });
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Could not open the billing portal');
    }
    setOpeningPortal(false);
  };

  const isOwner = org?.owner_email === user?.email;
  const periodEnd = org?.current_period_end ? new Date(org.current_period_end).toLocaleDateString() : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Plans</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your organization's subscription</p>
      </div>

      {org && (
        <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold">{org.name}</p>
            <p className="text-sm text-muted-foreground">
              {isOwner ? 'You own this organization' : `Owner: ${org.owner_email}`}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Current plan</p>
              <p className="font-semibold">{planLabels[org.plan] || org.plan}</p>
            </div>
            <Badge className={statusColors[org.plan_status] || ''}>{org.plan_status}</Badge>
            {isOwner && org.stripe_customer_id && (
              <Button variant="outline" size="sm" className="gap-2" onClick={handleManageBilling} disabled={openingPortal}>
                <ExternalLink className="h-4 w-4" />
                {openingPortal ? 'Opening…' : 'Manage billing'}
              </Button>
            )}
          </div>
        </div>
      )}

      {org?.cancel_at_period_end && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Your subscription is cancelled and the workspace moves to the Free plan
            {periodEnd ? ` on ${periodEnd}` : ' when the paid period ends'}. Open Manage billing to restart it.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map(plan => {
          const isCurrent = org?.plan === plan.key;
          return (
            <PlanCard key={plan.key} plan={plan}>
              <Button
                className="w-full"
                variant={plan.highlighted ? 'default' : 'outline'}
                disabled={isCurrent || subscribing !== null || (org && !isOwner)}
                onClick={() => handleSubscribe(plan)}
              >
                {isCurrent ? 'Current Plan'
                  : org && !isOwner ? 'Owner only'
                  : plan.price === null ? 'Contact Sales'
                  : subscribing === plan.key ? 'Redirecting...'
                  : `Subscribe to ${plan.name}`}
              </Button>
            </PlanCard>
          );
        })}
      </div>

      {!org && (
        <p className="text-xs text-muted-foreground text-center">Loading your organization…</p>
      )}
      {org && !isOwner && (
        <p className="text-xs text-muted-foreground text-center">Only the organization owner can change the billing plan.</p>
      )}
    </div>
  );
}