// Organization-level operational settings, stored on the Organization record.
// Every toggle on the Settings page reads and writes one of these keys.

export const DEFAULT_ORG_SETTINGS = {
  capture_gps: true,
  tracking_interval_ms: 0,
  overtime_alerts: true,
  late_clockin_alerts: true,
  missed_clockout_alerts: true,
  in_app_notifications: true,
  email_notifications: true,
  daily_report_default: false,
};

export function orgSettings(org) {
  return { ...DEFAULT_ORG_SETTINGS, ...(org?.settings || {}) };
}

export async function saveOrgSettings(base44, orgId, patch) {
  const org = await base44.entities.Organization.get(orgId);
  const merged = { ...(org.settings || {}), ...patch };
  await base44.entities.Organization.update(orgId, { settings: merged });
  return merged;
}