import { useEffect } from 'react';
import { applyAppearance, applyBranding } from '@/lib/branding';

// Keeps the signed-in app in step with the workspace's saved brand colours and
// appearance choice.
export default function useBranding(org) {
  const appearance = org?.appearance || 'dark';
  const brandColor = org?.brand_color || '';
  const brandAccent = org?.brand_accent || '';

  useEffect(() => {
    applyAppearance(appearance);
    if (appearance !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyAppearance('system');
    media.addEventListener?.('change', handler);
    return () => media.removeEventListener?.('change', handler);
  }, [appearance]);

  useEffect(() => {
    applyBranding({ brand_color: brandColor, brand_accent: brandAccent });
  }, [brandColor, brandAccent]);
}