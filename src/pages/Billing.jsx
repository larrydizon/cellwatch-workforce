import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { PLANS } from '@/lib/plans';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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

  const { data: org } = useQuery({
    queryKey: ['my-org', user?.organization_id],
    queryFn: () => base44.entities.Organization.get(user.organization_id),
    enabled: !!user?.organization_id,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      base44.functions.invoke('confirmSubscription', { sessionId }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['my-org'] });
        toast.success('Subscription activated!');
        window.history.replaceState({}, '', '/billing');
      }).catch(() => toast.error('Could not confirm subscription'));
    }
  }, []);

  const handleSubscribe = async (plan) => {
    if (!plan.checkout) {
      toast.error(plan.price === null ? 'Contact sales for an enterprise plan' : 'This plan does not require checkout');
      return;
    }
    setSubscribing(plan.key);
    try {
      const res = await base44.functions.invoke('createCheckoutSession', {
        plan: plan.key,
        returnUrl: window.location.origin,
      });
      window.location.href = res.data.url;
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to start checkout');
    }
    setSubscribing(null);
  };

  const isOwner = org?.owner_email === user?.email;

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
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Current plan</p>
              <p className="font-semibold">{planLabels[org.plan] || org.plan}</p>
            </div>
            <Badge className={statusColors[org.plan_status] || ''}>{org.plan_status}</Badge>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map(plan => {
          const isCurrent = org?.plan === plan.key;
          return (
            <div
              key={plan.key}
              className={`bg-card rounded-xl border p-5 flex flex-col ${plan.highlighted ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{plan.name}</p>
                {plan.highlighted && (
                  <Badge className="bg-primary/10 text-primary"><Sparkles className="h-3 w-3 mr-1" />Popular</Badge>
                )}
              </div>
              <p className="text-2xl font-bold mt-2">
                {plan.price === null ? 'Custom' : `$${plan.price}`}
                {plan.price !== null && <span className="text-sm font-normal text-muted-foreground">/{plan.period}</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{plan.seats ? `${plan.seats} employees` : 'Unlimited employees'}</p>

              <ul className="space-y-1.5 mt-4 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" /> <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full mt-4"
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
            </div>
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
