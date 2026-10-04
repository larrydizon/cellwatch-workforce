import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Upload } from 'lucide-react';
import CompanyLogo from '@/components/layout/CompanyLogo';

export default function IdentitySection({ form, set, disabled, onUpload, uploading }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-primary" /> Company Identity
        </CardTitle>
        <CardDescription>The name and mark shown throughout your workspace</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <CompanyLogo org={{ name: form.name, logo: form.logo }} className="h-14 w-14" textClassName="text-lg" />
          <div>
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-primary hover:underline">
              <Upload className="h-4 w-4" /> {form.logo ? 'Replace logo' : 'Upload logo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onUpload}
                disabled={disabled || uploading}
              />
            </label>
            <p className="text-xs text-muted-foreground mt-0.5">PNG or JPG, square works best</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Company name</Label>
          <Input value={form.name || ''} onChange={(e) => set('name', e.target.value)} disabled={disabled} />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={form.description || ''}
            onChange={(e) => set('description', e.target.value)}
            rows={2}
            disabled={disabled}
            placeholder="What your company does"
          />
        </div>
      </CardContent>
    </Card>
  );
}