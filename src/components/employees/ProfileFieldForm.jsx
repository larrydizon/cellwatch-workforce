import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FIELD_TYPES, slugify } from '@/lib/employeeProfile';

export default function ProfileFieldForm({ field, saving, onSave, onCancel }) {
  const [label, setLabel] = useState(field?.label || '');
  const [fieldType, setFieldType] = useState(field?.field_type || 'text');
  const [optionsText, setOptionsText] = useState((field?.options || []).join(', '));
  const [adminOnly, setAdminOnly] = useState(field?.admin_only ?? false);

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({
      label: label.trim(),
      // Keep the original key when editing so existing values stay attached
      key: field?.key || slugify(label),
      field_type: fieldType,
      options: fieldType === 'select'
        ? optionsText.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      admin_only: adminOnly,
    });
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
      <div className="space-y-2">
        <Label>Field Name</Label>
        <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Bank Account Number" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={fieldType} onValueChange={setFieldType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-start justify-between gap-3 sm:pt-6">
          <div>
            <Label>Admin only</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Employees can't edit it</p>
          </div>
          <Switch checked={adminOnly} onCheckedChange={setAdminOnly} />
        </div>
      </div>

      {fieldType === 'select' && (
        <div className="space-y-2">
          <Label>Options</Label>
          <Input value={optionsText} onChange={e => setOptionsText(e.target.value)} placeholder="Class 1, Class 2, Class 4" />
          <p className="text-xs text-muted-foreground">Separate each option with a comma.</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving || !label.trim()}>
          {saving ? 'Saving...' : 'Save Field'}
        </Button>
      </div>
    </div>
  );
}