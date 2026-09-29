import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { saveOrgSettings } from '@/lib/orgSettings';
import { logAudit } from '@/lib/auditLog';
import { toast } from 'sonner';

const TOGGLES = [
  { key: 'capture_gps', label: 'GPS Clock-in Enforcement', hint: 'Record location on clock in/out' },
  { key: 'overtime_alerts', label: 'Overtime Alerts', hint: 'Alert past 8 hours' },
  { key: 'email_notifications', label: 'Email Broadcasts', hint: 'Email notifications to staff' },
];

// Organization Rules & Settings quick toggles — persisted on the Organization.
export default function QuickTogglesPanel({ organizationId, settings, actorEmail, disabled }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(null);

  const handleToggle = async (key, value) => {
    setSaving(key);
    try {
      await saveOrgSettings(base44, organizationId, { [key]: value });
      await logAudit(organizationId, {
        category: 'security',
        action: 'setting_changed',
        detail: `${TOGGLES.find((t) => t.key === key)?.label} set to ${value ? 'on' : 'off'}`,
        actor_email: actorEmail,
      });
      queryClient.invalidateQueries({ queryKey: ['my-org', organizationId] });
      toast.success('Setting saved');
    } catch {
      toast.error('Could not save setting');
    }
    setSaving(null);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-5 h-full">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Organization Rules</p>
      <p className="text-xs text-muted-foreground mt-1">Applies to everyone in your organization</p>

      <div className="mt-4 space-y-4">
        {TOGGLES.map((toggle) => (
          <div key={toggle.key} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Label className="text-sm">{toggle.label}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{toggle.hint}</p>
            </div>
            <Switch
              checked={settings?.[toggle.key] ?? false}
              disabled={disabled || saving === toggle.key}
              onCheckedChange={(v) => handleToggle(toggle.key, v)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}