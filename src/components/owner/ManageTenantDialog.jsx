import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const EXTEND_OPTIONS = [7, 14, 30];

const STATUS_ACTIONS = [
  { status: 'active', label: 'Mark active', hint: 'Full access, no trial countdown' },
  { status: 'trial', label: 'Restart trial', hint: 'Resets to a fresh 14-day trial' },
  { status: 'past_due', label: 'Mark past due', hint: 'Payment failed — restricted after grace' },
  { status: 'canceled', label: 'Cancel access', hint: 'Workspace becomes read-only' },
];

export default function ManageTenantDialog({ tenant, onOpenChange, onDone }) {
  const [busy, setBusy] = useState(null);

  const run = async (key, payload, message) => {
    setBusy(key);
    try {
      await base44.functions.invoke('ownerConsole', { organization_id: tenant.id, ...payload });
      toast.success(message);
      onDone();
      onOpenChange(false);
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || 'Could not update this workspace');
    }
    setBusy(null);
  };

  return (
    <Dialog open={!!tenant} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{tenant?.name}</DialogTitle>
          <DialogDescription>
            {tenant?.owner_email || 'No owner on record'} · currently {tenant?.plan_status}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium mb-2">Extend trial</p>
            <div className="flex flex-wrap gap-2">
              {EXTEND_OPTIONS.map((days) => (
                <Button
                  key={days}
                  variant="outline"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => run(`extend-${days}`, { action: 'extend_trial', days }, `Trial extended by ${days} days`)}
                >
                  {busy === `extend-${days}` ? 'Saving…' : `+${days} days`}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Trial status</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {STATUS_ACTIONS.map((option) => (
                <Button
                  key={option.status}
                  variant="outline"
                  className="h-auto flex-col items-start gap-0.5 py-2.5 text-left"
                  disabled={busy !== null}
                  onClick={() => run(option.status, { action: 'set_status', status: option.status }, `${tenant.name} set to ${option.label.toLowerCase()}`)}
                >
                  <span className="text-sm font-medium">
                    {busy === option.status ? 'Saving…' : option.label}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">{option.hint}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}