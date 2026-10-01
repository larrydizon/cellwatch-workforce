import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, MapPin, Bell, Clock, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { saveOrgSettings } from '@/lib/orgSettings';
import { logAudit } from '@/lib/auditLog';
import { isAdminUser } from '@/lib/employeeProfile';
import useOrganization from '@/hooks/useOrganization';

const INTERVAL_OPTIONS = [
  { label: 'Disabled', value: '0' },
  { label: 'Every 5 seconds', value: '5000' },
  { label: 'Every 15 seconds', value: '15000' },
  { label: 'Every 30 seconds', value: '30000' },
  { label: 'Every 1 minute', value: '60000' },
  { label: 'Every 2 minutes', value: '120000' },
  { label: 'Every 5 minutes', value: '300000' },
];

// Presence checks are deliberately coarser than the field GPS interval — a
// snapshot every few seconds would be unusable for everyone involved.
const PRESENCE_INTERVAL_OPTIONS = [
  { label: 'Every 5 minutes', value: '300000' },
  { label: 'Every 10 minutes', value: '600000' },
  { label: 'Every 15 minutes', value: '900000' },
  { label: 'Every 30 minutes', value: '1800000' },
  { label: 'Every 1 hour', value: '3600000' },
];

export default function Settings() {
  const { user } = useOutletContext();
  const queryClient = useQueryClient();
  const orgState = useOrganization(user);
  const [saving, setSaving] = useState(null);

  const { data: levels = [] } = useQuery({
    queryKey: ['user-levels', user?.organization_id],
    queryFn: () => base44.entities.UserLevel.filter({ organization_id: user.organization_id }, 'created_date', 100),
    enabled: !!user?.organization_id,
  });

  const canEdit = isAdminUser(user, levels);
  const settings = orgState.settings;
  const orgId = user?.organization_id;

  const update = async (key, value, label) => {
    if (!canEdit) return;
    setSaving(key);
    try {
      await saveOrgSettings(base44, orgId, { [key]: value });
      await logAudit(orgId, {
        category: 'security',
        action: 'setting_changed',
        detail: `${label} set to ${typeof value === 'boolean' ? (value ? 'on' : 'off') : value}`,
        actor_email: user?.email,
      });
      queryClient.invalidateQueries({ queryKey: ['my-org', orgId] });
      toast.success('Setting saved');
    } catch {
      toast.error('Could not save setting');
    }
    setSaving(null);
  };

  const Toggle = ({ settingKey, label, hint }) => (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
      </div>
      <Switch
        checked={settings[settingKey]}
        disabled={!canEdit || saving === settingKey}
        onCheckedChange={(v) => update(settingKey, v, label)}
      />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-heading">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {canEdit ? 'Manage your workspace preferences' : 'Your workspace preferences (view only)'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" /> GPS & Location
          </CardTitle>
          <CardDescription>Configure location tracking for your workforce</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle settingKey="capture_gps" label="Capture GPS on clock in/out" hint="Record employee location when they clock in or out" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label>Live location update interval</Label>
              <p className="text-xs text-muted-foreground mt-0.5">How often to refresh GPS while clocked in</p>
            </div>
            <Select
              value={String(settings.tracking_interval_ms ?? 0)}
              onValueChange={(v) => update('tracking_interval_ms', Number(v), 'Location update interval')}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="h-5 w-5 text-primary" /> Office &amp; Remote Presence Checks
          </CardTitle>
          <CardDescription>
            How office and remote workers confirm they are at work while being paid by the hour.
            Each employee is flagged individually on their profile, and every check needs their
            one-time consent before anything is captured.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            settingKey="presence_checks_enabled"
            label="Presence checks"
            hint="Master switch — nothing is captured for anyone while this is off"
          />
          <Toggle
            settingKey="presence_camera"
            label="Camera snapshot"
            hint="Capture a still photo from the front camera at each check"
          />
          <Toggle
            settingKey="presence_location"
            label="Device location"
            hint="Record where the device was when the check ran"
          />
          <Toggle
            settingKey="presence_device"
            label="Device identity"
            hint="Record which device the check came from, so a swap mid-shift is visible"
          />
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label>Presence check interval</Label>
              <p className="text-xs text-muted-foreground mt-0.5">How often a check runs while an office or remote worker is clocked in</p>
            </div>
            <Select
              value={String(settings.presence_interval_ms ?? 900000)}
              onValueChange={(v) => update('presence_interval_ms', Number(v), 'Presence check interval')}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESENCE_INTERVAL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" /> Time Clock
          </CardTitle>
          <CardDescription>Time tracking rules and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle settingKey="overtime_alerts" label="Overtime alerts" hint="Alert when an employee exceeds 8 hours" />
          <Toggle settingKey="late_clockin_alerts" label="Late clock-in alerts" hint="Alert if clock-in is 15+ minutes after shift start" />
          <Toggle settingKey="missed_clockout_alerts" label="Missed clock-out alerts" hint="Alert if employee hasn't clocked out after shift" />
          <Toggle settingKey="daily_report_default" label="Require daily reports by default" hint="New employees must file a daily report at clock-out" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" /> Notifications
          </CardTitle>
          <CardDescription>How your team receives alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle settingKey="in_app_notifications" label="In-app notifications" hint="Show notifications within the app" />
          <Toggle settingKey="email_notifications" label="Email notifications" hint="Send important alerts via email" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" /> Privacy (NZ)
          </CardTitle>
          <CardDescription>Privacy controls for New Zealand compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-accent/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
            <p>• GPS data is collected only during work hours (clock in/out)</p>
            <p>• Employees are notified when location is being tracked</p>
            <p>• Location data is retained for 90 days by default</p>
            <p>• Employees can request access to their own GPS records</p>
            <p>• All data is stored securely and encrypted at rest</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}