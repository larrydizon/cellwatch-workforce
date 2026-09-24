import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock } from 'lucide-react';
import ProfileSection from './ProfileSection';

export default function CustomFieldsSection({ fields, values, onChange, canEditAdminFields }) {
  if (fields.length === 0) return null;

  return (
    <ProfileSection title="Additional Details">
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map(field => {
          const locked = field.admin_only && !canEditAdminFields;
          const value = values[field.key] ?? '';

          return (
            <div key={field.id} className="space-y-2">
              <Label className="flex items-center gap-1.5">
                {field.label}
                {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
              </Label>

              {field.field_type === 'select' ? (
                <Select
                  value={value || ' '}
                  onValueChange={(v) => onChange(field.key, v === ' ' ? '' : v)}
                  disabled={locked}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Not specified</SelectItem>
                    {(field.options || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                  value={value}
                  onChange={e => onChange(field.key, e.target.value)}
                  disabled={locked}
                />
              )}
            </div>
          );
        })}
      </div>
      {fields.some(f => f.admin_only) && !canEditAdminFields && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-4">
          <Lock className="h-3 w-3" /> Fields marked with a lock are managed by an administrator.
        </p>
      )}
    </ProfileSection>
  );
}