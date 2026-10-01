import React from 'react';
import moment from 'moment';
import { Camera, MapPin, MonitorSmartphone, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_STYLE = {
  snapshot: { icon: Camera, label: 'Snapshot', className: 'text-primary' },
  location: { icon: MapPin, label: 'Location', className: 'text-primary' },
  missed: { icon: AlertTriangle, label: 'Missed', className: 'text-warning' },
};

// A timestamped log of the day's checks. Tapping a snapshot opens it full size;
// tapping a row jumps the map to that spot.
export default function PresenceLog({ checks = [], signedUrls = {}, onFocus }) {
  return (
    <div className="divide-y divide-border">
      {checks.map((check) => {
        const style = TYPE_STYLE[check.check_type] || TYPE_STYLE.location;
        const Icon = style.icon;
        const hasCoords = Number.isFinite(check.latitude) && Number.isFinite(check.longitude);
        const url = check.file_uri ? signedUrls[check.file_uri] : null;

        return (
          <div key={check.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                <img
                  src={url}
                  alt="Presence snapshot"
                  className="h-14 w-14 rounded-lg object-cover border border-border"
                />
              </a>
            ) : (
              <div className={cn('h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0', style.className)}>
                <Icon className="h-5 w-5" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{moment(check.captured_at).format('h:mm:ss A')}</span>
                <span className={cn('text-xs font-medium', style.className)}>{style.label}</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                {check.device_label && (
                  <span className="flex items-center gap-1">
                    <MonitorSmartphone className="h-3 w-3" /> {check.device_label}
                  </span>
                )}
                {hasCoords && (
                  <button
                    type="button"
                    onClick={() => onFocus?.(check)}
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <MapPin className="h-3 w-3" /> Show on map
                  </button>
                )}
              </div>

              {check.note && (
                <p className="text-xs text-muted-foreground mt-1">{check.note}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}