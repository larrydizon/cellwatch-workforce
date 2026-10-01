// A browser has no hardware serial to read, so each browser is given a stable
// token the first time it is used. A different token simply means a different
// device — it is reported, never treated as an error.
const KEY = 'cellwatch_device_id';

export function getDeviceId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return 'unknown-device';
  }
}

export function getDeviceLabel() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const platform = /iPhone|iPad|iPod/.test(ua) ? 'iOS'
    : /Android/.test(ua) ? 'Android'
      : /Macintosh|Mac OS X/.test(ua) ? 'Mac'
        : /Windows/.test(ua) ? 'Windows'
          : /Linux/.test(ua) ? 'Linux'
            : 'Device';
  const browser = /Edg\//.test(ua) ? 'Edge'
    : /OPR\//.test(ua) ? 'Opera'
      : /Chrome\//.test(ua) ? 'Chrome'
        : /Firefox\//.test(ua) ? 'Firefox'
          : /Safari\//.test(ua) ? 'Safari'
            : 'Browser';
  return `${platform} · ${browser}`;
}