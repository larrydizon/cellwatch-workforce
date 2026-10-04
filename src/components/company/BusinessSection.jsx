import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import ProfileField from './ProfileField';

export default function BusinessSection({ form, set, disabled }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Briefcase className="h-5 w-5 text-primary" /> Company Details
        </CardTitle>
        <CardDescription>Registration and operating details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProfileField label="Legal name" value={form.legal_name} onChange={(v) => set('legal_name', v)} disabled={disabled} placeholder="Registered company name" />
        <ProfileField label="Business ID" value={form.business_id} onChange={(v) => set('business_id', v)} disabled={disabled} placeholder="NZBN / company number" />
        <ProfileField label="Industry" value={form.industry} onChange={(v) => set('industry', v)} disabled={disabled} placeholder="e.g. Telecommunications" />
        <ProfileField label="Timezone" value={form.timezone} onChange={(v) => set('timezone', v)} disabled={disabled} placeholder="Pacific/Auckland" hint="Used for schedules and reporting" />
      </CardContent>
    </Card>
  );
}