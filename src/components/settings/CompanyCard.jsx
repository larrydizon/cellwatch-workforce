import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { runOrganizationCommand } from '@/lib/organizations';
import { logAudit } from '@/lib/auditLog';
import CompanyLogo from '@/components/layout/CompanyLogo';

// The company's own identity — name, logo and description — shown throughout
// the signed-in app. Only administrators reach the editing controls.
export default function CompanyCard({ org, orgId, user, canEdit }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(org?.name || '');
  const [description, setDescription] = useState(org?.description || '');
  const [logo, setLogo] = useState(org?.logo || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Keep the fields in step with the loaded company once it arrives.
  const [syncedId, setSyncedId] = useState(org?.id);
  if (org?.id && org.id !== syncedId) {
    setSyncedId(org.id);
    setName(org.name || '');
    setDescription(org.description || '');
    setLogo(org.logo || '');
  }

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setLogo(file_url);
    } catch (e) {
      toast.error('Could not upload logo');
    }
    setUploading(false);
  };

  const save = async () => {
    if (!name.trim()) { toast.error('Enter your company name'); return; }
    setSaving(true);
    try {
      await runOrganizationCommand('update', {
        changes: { name: name.trim(), logo, description: description.trim() },
      });
      await logAudit(orgId, {
        category: 'general',
        action: 'company_identity_updated',
        detail: 'Company name, logo or description updated',
        actor_email: user?.email,
      });
      queryClient.invalidateQueries({ queryKey: ['my-org', orgId] });
      toast.success('Company details saved');
    } catch (e) {
      toast.error('Could not save company details');
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-primary" /> Company
        </CardTitle>
        <CardDescription>Your company's name, logo and description, shown across the app</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <CompanyLogo org={{ name, logo }} className="h-14 w-14" textClassName="text-lg" />
          <div>
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-primary hover:underline">
              <Upload className="h-4 w-4" /> {logo ? 'Replace logo' : 'Upload logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={!canEdit || uploading} />
            </label>
            <p className="text-xs text-muted-foreground mt-0.5">PNG or JPG, square works best</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Company Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} disabled={!canEdit} />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} disabled={!canEdit} />
        </div>

        {canEdit && (
          <Button onClick={save} disabled={saving || uploading}>
            {saving ? 'Saving...' : 'Save company details'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}