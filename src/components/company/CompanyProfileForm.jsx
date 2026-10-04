import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { runOrganizationCommand } from '@/lib/organizations';
import { logAudit } from '@/lib/auditLog';
import IdentitySection from './IdentitySection';
import BrandingSection from './BrandingSection';
import ContactSection from './ContactSection';
import BusinessSection from './BusinessSection';

// The editable company profile, shared by the Settings card and the dedicated
// Company Profile page so both always show the same values.
const PROFILE_FIELDS = [
  'name', 'description', 'logo',
  'brand_color', 'brand_accent',
  'address', 'phone', 'email', 'website',
  'legal_name', 'business_id', 'industry', 'timezone',
];

function formFromOrg(org) {
  const form = {};
  PROFILE_FIELDS.forEach((field) => { form[field] = org?.[field] ?? ''; });
  form.appearance = org?.appearance || 'dark';
  return form;
}

export default function CompanyProfileForm({ org, orgId, user, canEdit }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => formFromOrg(org));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Keep the fields in step with the loaded company.
  const syncKey = `${org?.id || ''}:${org?.updated_date || ''}`;
  const [syncedKey, setSyncedKey] = useState(syncKey);
  if (org?.id && syncKey !== syncedKey) {
    setSyncedKey(syncKey);
    setForm(formFromOrg(org));
  }

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      set('logo', file_url);
    } catch {
      toast.error('Could not upload logo');
    }
    setUploading(false);
  };

  const save = async () => {
    if (!form.name?.trim()) { toast.error('Enter your company name'); return; }
    setSaving(true);
    try {
      const changes = {};
      PROFILE_FIELDS.forEach((field) => { changes[field] = String(form[field] ?? '').trim(); });
      changes.appearance = form.appearance || 'dark';
      await runOrganizationCommand('update', { changes });
      await logAudit(orgId, {
        category: 'general',
        action: 'company_identity_updated',
        detail: 'Company profile updated',
        actor_email: user?.email,
      });
      queryClient.invalidateQueries({ queryKey: ['my-org', orgId] });
      toast.success('Company profile saved');
    } catch {
      toast.error('Could not save company profile');
    }
    setSaving(false);
  };

  const disabled = !canEdit;

  return (
    <div className="space-y-6">
      <IdentitySection form={form} set={set} disabled={disabled} onUpload={handleUpload} uploading={uploading} />
      <BrandingSection form={form} set={set} disabled={disabled} />
      <ContactSection form={form} set={set} disabled={disabled} />
      <BusinessSection form={form} set={set} disabled={disabled} />

      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving || uploading} className="w-full sm:w-auto">
            {saving ? 'Saving...' : 'Save company profile'}
          </Button>
        </div>
      )}
    </div>
  );
}