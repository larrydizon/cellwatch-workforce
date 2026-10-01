import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Captures a position on the workspace's configured interval and stores it
// against the open shift. Nothing runs without consent, an active entry, GPS
// capture switched on and a non-zero interval — and it stops the moment the
// entry closes, because the hook is disabled.
export default function useLocationTrail({ enabled, entryId, intervalMs }) {
  const [lastPointAt, setLastPointAt] = useState(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!enabled || !entryId || !intervalMs || !navigator.geolocation) return;
    let cancelled = false;

    const capture = () => {
      if (busyRef.current) return;
      busyRef.current = true;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await base44.functions.invoke('locationCommand', {
              action: 'record',
              entry_id: entryId,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
            if (!cancelled) setLastPointAt(new Date().toISOString());
          } catch {
            // The server refuses when consent, capture or the shift state says no.
          }
          busyRef.current = false;
        },
        () => {
          busyRef.current = false;
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    };

    capture();
    const timer = setInterval(capture, Math.max(10000, intervalMs));
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled, entryId, intervalMs]);

  return { lastPointAt };
}