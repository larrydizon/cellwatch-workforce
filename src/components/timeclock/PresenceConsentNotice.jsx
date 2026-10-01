import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLocationConsent } from '@/lib/LocationConsentContext';

const POINTS = [
  'While you are clocked in, a camera snapshot is taken at intervals set by your workplace.',
  'Your device location and which device you are using may be recorded with each check.',
  'Checks run only between clock in and clock out — never in your own time.',
  'Nothing is recorded if you refuse, and a missed check never blocks your shift.',
  'You can turn presence checks off at any time from My Profile.',
];

export default function PresenceConsentNotice() {
  const {
    isLoading, hasRecord, decisionMade, presenceRequested, presenceDecisionMade,
    savePresenceConsent, isSaving,
  } = useLocationConsent();

  // Shown after the location decision so the two notices never stack up.
  const open = !isLoading && hasRecord && decisionMade && presenceRequested && !presenceDecisionMade;

  const choose = async (granted) => {
    await savePresenceConsent(granted);
    toast.success(
      granted
        ? 'Presence checks are on — they run only while you are clocked in.'
        : 'Presence checks stay off. You can turn them on later from My Profile.'
    );
  };

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
          className={cn(
            'fixed z-50 grid gap-5 border border-border bg-background p-6 shadow-lg',
            'bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-2xl',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4',
            'sm:bottom-auto sm:left-[50%] sm:right-auto sm:top-[50%] sm:w-full sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-95'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1.5">
              <DialogPrimitive.Title className="text-lg font-semibold leading-tight tracking-tight font-heading">
                Presence checks
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                Your workplace has you recorded as an office or remote worker paid by
                the hour. Before any check runs, we need your one-time consent —
                asked once, and never again.
              </DialogPrimitive.Description>
            </div>
          </div>

          <ul className="space-y-2.5">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-2.5 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <a
            href="/settings"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary underline underline-offset-4"
          >
            Read the full privacy details in Settings
          </a>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" disabled={isSaving} onClick={() => choose(false)} className="sm:w-auto">
              Decline
            </Button>
            <Button disabled={isSaving} onClick={() => choose(true)} className="sm:w-auto">
              Accept
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}