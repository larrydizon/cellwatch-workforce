import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// One labelled text field inside the company profile sections.
export default function ProfileField({ label, value, onChange, disabled, placeholder, hint }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}