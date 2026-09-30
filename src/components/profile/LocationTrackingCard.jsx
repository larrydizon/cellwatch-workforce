import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLocationConsent } from '@/lib/LocationConsentContext';

// Lets an employee change their mind later without ever being asked twice.
export default function LocationTrackingCard() {
  const { isLoading, decisionMade, consentGiven, saveConsent, isSaving } = useLocationConsent();

  if (isLoading || !decisionMade) return null;

  const toggle = async () => {
    await saveConsent(!consentGiven);
    toast.success(
      consentGiven
        ? 'Location tracking is off. Nothing new will be recorded.'
        : 'Location tracking is on — it records only while you are clocked in.'
    );
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">Location tracking</h2>
          <p className="text-xs text-muted-foreground">
            {consentGiven
              ? 'On — recorded only while you are clocked in'
              : 'Off — no location is being recorded'}
          </p>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={toggle} disabled={isSaving}>
        {consentGiven ? 'Turn off location tracking' : 'Turn on location tracking'}
      </Button>

      <p className="text-xs text-muted-foreground">
        Full details are in the privacy section of <Link to="/settings" className="text-primary underline underline-offset-4">Settings</Link>.
      </p>
    </div>
  );
}