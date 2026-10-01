import React from 'react';
import { Camera, MapPin } from 'lucide-react';
import moment from 'moment';

const CHECK_LABEL = {
  snapshot: 'Snapshot captured',
  location: 'Location recorded',
  missed: 'Check missed',
};

// Tells the employee their tracking is live without making them hunt for it.
export default function ShiftTrackingStatus({
  trailPoints = 0,
  presenceEnabled = false,
  presenceChecks = 0,
  lastCheckAt,
  lastCheckType,
}) {
  const showTrail = trailPoints > 0;

  if (!showTrail && !presenceEnabled) return null;

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 pt-3 border-t border-success/20 text-xs">
      {showTrail && (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {trailPoints} trail point{trailPoints === 1 ? '' : 's'} recorded this shift
        </span>
      )}
      {presenceEnabled && (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Camera className="h-3.5 w-3.5 text-primary" />
          {lastCheckAt
            ? `Last check ${moment(lastCheckAt).format('h:mm A')} · ${CHECK_LABEL[lastCheckType] || 'Recorded'} · ${presenceChecks} this shift`
            : 'Presence checks are on — waiting for the first check'}
        </span>
      )}
    </div>
  );
}