import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { slugify } from '@/lib/employeeProfile';

export default function UserLevelForm({ level, saving, onSave, onCancel }) {
  const [label, setLabel] = useState(level?.label || '');
  const [isAdmin, setIsAdmin] = useState(level?.is_admin ?? false);

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({
      label: label.trim(),
      // Keep the original value when editing so assigned employees stay on this level
      value: level?.value || slugify(label),
      is_admin: isAdmin,
    });
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
      <div className="space-y-2">
        <Label>Level Name</Label>
        <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Office Manager" />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <Label>Administrator access</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Employees on this level can manage the workspace
          </p>
        </div>
        <Switch checked={isAdmin} onCheckedChange={setIsAdmin} />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving || !label.trim()}>
          {saving ? 'Saving...' : 'Save Level'}
        </Button>
      </div>
    </div>
  );
}