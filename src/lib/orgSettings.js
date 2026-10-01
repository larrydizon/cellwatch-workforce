// Organization-level operational settings, stored on the Organization record.
// Every toggle on the Settings page reads and writes one of these keys.
import { runOrganizationCommand } from './organizations';

export const DEFAULT_ORG_SETTINGS = {
  capture_gps: true,
  tracking_interval_ms: 0,
  overtime_alerts: true,
  late_clockin_alerts: true,
  missed_clockout_alerts: true,
  in_app_notifications: true,
  email_notifications: true,
  daily_report_default: false,
  // Office / remote presence checks — separate from field GPS tracking
  presence_checks_enabled: false,
  presence_camera: true,
  presence_location: true,
  presence_device: true,
  presence_interval_ms: 900000,
};

export function orgSettings(org) {
  return { ...DEFAULT_ORG_SETTINGS, ...(org?.settings || {}) };
}

export async function saveOrgSettings(base44, orgId, patch) {
  const org = await base44.entities.Organization.get(orgId);
  const merged = { ...(org.settings || {}), ...patch };
  await runOrganizationCommand('update', { changes: { settings: merged } });
  return merged;
}