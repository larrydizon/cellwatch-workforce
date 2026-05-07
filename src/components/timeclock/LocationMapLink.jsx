import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

/**
 * Shows GPS coordinates with links to open in Google Maps or Apple Maps.
 */
export default function LocationMapLink({ lat, lng, label }) {
  if (!lat || !lng) return null;

  const googleUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const appleUrl = `https://maps.apple.com/?q=${lat},${lng}`;

  // Detect iOS/macOS to prefer Apple Maps link
  const isApple = /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);

  return (
    <div className="flex flex-col gap-1">
      {label && <p className="text-xs text-muted-foreground font-medium">{label}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-xs text-muted-foreground font-mono">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </span>
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Google Maps <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={appleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Apple Maps <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}