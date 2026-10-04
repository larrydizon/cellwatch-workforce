// Company branding is applied by overriding the theme tokens on <html>, so the
// whole signed-in app picks up the workspace's colours and appearance.

const PRIMARY_TOKENS = ['--primary', '--ring', '--sidebar-primary', '--sidebar-ring', '--chart-1'];

// Convert a #rrggbb hex into the "H S% L%" channel string the theme tokens expect.
export function hexToHslChannels(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Text that stays readable on top of the chosen brand colour.
function readableForeground(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '222 47% 11%' : '0 0% 100%';
}

export function applyBranding(org) {
  const root = document.documentElement;
  const primary = hexToHslChannels(org?.brand_color);
  const accent = hexToHslChannels(org?.brand_accent);

  if (primary) {
    PRIMARY_TOKENS.forEach((token) => root.style.setProperty(token, primary));
    const foreground = readableForeground(org?.brand_color);
    root.style.setProperty('--primary-foreground', foreground);
    root.style.setProperty('--sidebar-primary-foreground', foreground);
  } else {
    PRIMARY_TOKENS.forEach((token) => root.style.removeProperty(token));
    root.style.removeProperty('--primary-foreground');
    root.style.removeProperty('--sidebar-primary-foreground');
  }

  if (accent) root.style.setProperty('--chart-2', accent);
  else root.style.removeProperty('--chart-2');
}

// The workspace default is the app's dark look; "system" follows the device.
export function isDarkAppearance(mode) {
  if (mode === 'light') return false;
  if (mode === 'system') {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  }
  return true;
}

export function applyAppearance(mode) {
  const dark = isDarkAppearance(mode);
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.classList.toggle('light', !dark);
}