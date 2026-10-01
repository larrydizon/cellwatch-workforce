import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { getDeviceId, getDeviceLabel } from '@/lib/deviceId';

function readPosition() {
  if (!navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

// A still frame from the front camera, uploaded to private storage. The stream is
// always stopped, even when the capture fails part-way through.
async function captureSnapshot() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 640 } },
    audio: false,
  });
  try {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();
    await new Promise((resolve) => setTimeout(resolve, 700));

    const width = 640;
    const height = Math.round(width * (video.videoHeight / video.videoWidth)) || 480;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(video, 0, 0, width, height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.7));
    if (!blob) throw new Error('Capture failed');
    const file = new File([blob], `presence-${Date.now()}.jpg`, { type: 'image/jpeg' });
    const uploaded = await base44.integrations.Core.UploadPrivateFile({ file });
    return uploaded?.file_uri || null;
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}

// Runs a presence check on the workspace interval for office / remote workers.
// A refused camera permission or an unavailable reading becomes a missed check
// and nothing more — no timesheet flag, no block on the shift.
export default function usePresenceChecks({ enabled, entryId, intervalMs, camera, location, device }) {
  const [lastCheck, setLastCheck] = useState(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!enabled || !entryId || !intervalMs) return;
    let cancelled = false;

    const run = async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const position = location ? await readPosition() : null;

        let fileUri = null;
        let note = '';
        if (camera) {
          try {
            fileUri = await captureSnapshot();
          } catch (error) {
            note = error?.name === 'NotAllowedError'
              ? 'Camera permission was refused'
              : 'Camera was unavailable';
          }
        }

        const checkType = fileUri ? 'snapshot' : position ? 'location' : 'missed';
        if (!fileUri && !position && !note) note = 'No camera or location reading was available';

        const check = await base44.functions.invoke('presenceCommand', {
          action: 'record',
          entry_id: entryId,
          check_type: checkType,
          latitude: position?.latitude,
          longitude: position?.longitude,
          accuracy: position?.accuracy,
          device_id: device ? getDeviceId() : undefined,
          device_label: device ? getDeviceLabel() : undefined,
          file_uri: fileUri || undefined,
          note: note || undefined,
        }).then((res) => res?.data?.check ?? null);

        if (!cancelled) setLastCheck(check);
      } catch {
        // The server refuses when consent or a workspace switch is off.
      }
      busyRef.current = false;
    };

    run();
    const timer = setInterval(run, Math.max(60000, intervalMs));
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled, entryId, intervalMs, camera, location, device]);

  return { lastCheck };
}