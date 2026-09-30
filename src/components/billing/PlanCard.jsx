import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';

// One plan card, shared by the public pricing section and the Billing page so
// both always show the same price, seats and features. The action is supplied
// by the caller: a trial button on the landing page, checkout inside the app.
export default function PlanCard({ plan, children }) {
  return (
    <div className={`bg-card rounded-xl border p-5 flex flex-col ${plan.highlighted ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
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

      <div className="mt-4">{children}</div>
    </div>
  );
}