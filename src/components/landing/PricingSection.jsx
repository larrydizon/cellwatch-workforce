import React from 'react';
import { Button } from '@/components/ui/button';
import PlanCard from '@/components/billing/PlanCard';
import { PLANS } from '@/lib/plans';
import { toast } from 'sonner';

export default function PricingSection({ onStartTrial }) {
  return (
    <section id="pricing" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Simple pricing, per company
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Every plan starts with a 14-day free trial — no card required. Change plan whenever
          your crew grows.
        </p>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <PlanCard key={plan.key} plan={plan}>
              {plan.key === 'enterprise' ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toast('Enterprise is arranged with our team — start a free trial and we will be in touch.')}
                >
                  Contact sales
                </Button>
              ) : (
                <Button
                  variant={plan.highlighted ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => onStartTrial(plan.key)}
                >
                  Start free trial
                </Button>
              )}
            </PlanCard>
          ))}
        </div>
      </div>
    </section>
  );
}