import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette } from 'lucide-react';

const APPEARANCE_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'Match device' },
];

function ColorField({ label, hint, value, fallback, onChange, disabled }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || fallback}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-9 w-12 rounded-md border border-input bg-transparent cursor-pointer disabled:opacity-50"
        />
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={`${fallback} (default)`}
        />
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export default function BrandingSection({ form, set, disabled }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="h-5 w-5 text-primary" /> Branding
        </CardTitle>
        <CardDescription>Your brand colours and how the workspace looks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ColorField
          label="Primary brand colour"
          hint="Used for buttons, links and highlights"
          value={form.brand_color}
          fallback="#38BDF8"
          onChange={(v) => set('brand_color', v)}
          disabled={disabled}
        />
        <ColorField
          label="Accent colour"
          hint="Used for charts and secondary highlights"
          value={form.brand_accent}
          fallback="#10B981"
          onChange={(v) => set('brand_accent', v)}
          disabled={disabled}
        />
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label>Appearance</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Light, dark, or match each person's device</p>
          </div>
          <Select
            value={form.appearance || 'dark'}
            onValueChange={(v) => set('appearance', v)}
            disabled={disabled}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPEARANCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}