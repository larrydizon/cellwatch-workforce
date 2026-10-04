import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Phone } from 'lucide-react';
import ProfileField from './ProfileField';

export default function ContactSection({ form, set, disabled }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone className="h-5 w-5 text-primary" /> Contact Information
        </CardTitle>
        <CardDescription>How clients and staff reach your business</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Address</Label>
          <Textarea
            value={form.address || ''}
            onChange={(e) => set('address', e.target.value)}
            rows={2}
            disabled={disabled}
            placeholder="Street, suburb, city, postcode"
          />
        </div>
        <ProfileField label="Phone" value={form.phone} onChange={(v) => set('phone', v)} disabled={disabled} placeholder="+64 9 000 0000" />
        <ProfileField label="Email" value={form.email} onChange={(v) => set('email', v)} disabled={disabled} placeholder="office@company.co.nz" />
        <ProfileField label="Website" value={form.website} onChange={(v) => set('website', v)} disabled={disabled} placeholder="www.company.co.nz" />
      </CardContent>
    </Card>
  );
}