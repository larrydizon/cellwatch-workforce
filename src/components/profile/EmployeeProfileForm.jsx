import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Mail, Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { POSITIONS } from '@/components/forms/IndustryTemplates';
import { CONTRACT_TYPES, userLevelLabel, buildProfileForm, buildProfilePayload } from '@/lib/employeeProfile';
import ProfileSection from './ProfileSection';
import ProfilePhotoSection from './ProfilePhotoSection';
import CustomFieldsSection from './CustomFieldsSection';

export default function EmployeeProfileForm({ targetUser, viewer, onSaved }) {
  const queryClient = useQueryClient();
  const isSelf = viewer?.id === targetUser?.id;
  // Pay details are managed by administrators (including their own record);
  // the user level is never editable on your own record
  const canEditPayFields = viewer?.role === 'admin';
  const canEditAdminFields = canEditPayFields && !isSelf;
  const [form, setForm] = useState(() => buildProfileForm(targetUser));
  const [saving, setSaving] = useState(false);

  const { data: customFields = [] } = useQuery({
    queryKey: ['profile-fields', viewer?.organization_id],
    queryFn: () => base44.entities.ProfileField.filter({ organization_id: viewer.organization_id }, 'created_date', 100),
    enabled: !!viewer?.organization_id,
  });

  const { data: levels = [] } = useQuery({
    queryKey: ['user-levels', viewer?.organization_id],
    queryFn: () => base44.entities.UserLevel.filter({ organization_id: viewer.organization_id }, 'created_date', 100),
    enabled: !!viewer?.organization_id,
  });

  const setCustomField = (key, value) =>
    setForm(f => ({ ...f, customFields: { ...f.customFields, [key]: value } }));

  useEffect(() => { setForm(buildProfileForm(targetUser)); }, [targetUser]);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = buildProfilePayload(form, { userLevel: canEditAdminFields, pay: canEditPayFields });
      const level = levels.find(l => l.value === form.user_level);
      if (isSelf) {
        await base44.auth.updateMe(payload);
      } else {
        await base44.entities.User.update(targetUser.id, {
          ...payload,
          // Administrator access follows the chosen user level
          ...(canEditAdminFields && level ? { role: level.is_admin ? 'admin' : 'user' } : {}),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('Profile saved');
      onSaved?.();
    } catch {
      toast.error('Could not save profile');
    }
    setSaving(false);
  };

  const initials = (targetUser?.full_name || '?').split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
          {form.photos[0] ? (
            <img src={form.photos[0]} alt={targetUser?.full_name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-primary font-bold text-xl">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold truncate">{targetUser?.full_name || 'Employee'}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> <span className="truncate">{targetUser?.email}</span>
          </p>
          <div className="mt-2">
            {canEditAdminFields ? (
              <Select value={form.user_level || ' '} onValueChange={(v) => set('user_level', v === ' ' ? '' : v)}>
                <SelectTrigger className="h-8 w-56"><SelectValue placeholder="Select user level..." /></SelectTrigger>
                <SelectContent>
                  {levels.map(l => (
                    <SelectItem key={l.id} value={l.value}>
                      {l.is_admin ? `${l.label} (Admin)` : l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" /> {userLevelLabel(targetUser, levels)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Personal details */}
      <ProfileSection title="Personal Details">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+64 21 000 0000" />
          </div>
          <div className="space-y-2">
            <Label>Position</Label>
            <Select value={form.position || ' '} onValueChange={(v) => set('position', v === ' ' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Select position..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Not specified</SelectItem>
                {POSITIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Label>Address</Label>
          <Textarea
            className="h-20"
            value={form.address}
            onChange={e => set('address', e.target.value)}
            placeholder="Street, suburb, city, postcode"
          />
        </div>
      </ProfileSection>

      {/* Employment */}
      <ProfileSection title="Employment">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Job Title</Label>
            <Input value={form.job_title} onChange={e => set('job_title', e.target.value)} placeholder="e.g. Senior Technician" />
          </div>
          <div className="space-y-2">
            <Label>Team</Label>
            <Input value={form.team} onChange={e => set('team', e.target.value)} placeholder="e.g. Fibre Crew A" />
          </div>
          <div className="space-y-2">
            <Label>Contract Type</Label>
            <Select value={form.contract_type || ' '} onValueChange={(v) => set('contract_type', v === ' ' ? '' : v)} disabled={!canEditPayFields}>
              <SelectTrigger><SelectValue placeholder="Select contract..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Not specified</SelectItem>
                {CONTRACT_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>IRD Number</Label>
            <Input value={form.ird_number} onChange={e => set('ird_number', e.target.value)} placeholder="000-000-000" disabled={!canEditPayFields} />
          </div>
          <div className="space-y-2">
            <Label>Hourly Rate</Label>
            <Input type="number" step="0.01" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} placeholder="0.00" disabled={!canEditPayFields} />
          </div>
          <div className="space-y-2">
            <Label>Overtime Multiplier</Label>
            <Input type="number" step="0.1" value={form.overtime_multiplier} onChange={e => set('overtime_multiplier', e.target.value)} placeholder="1.5" disabled={!canEditPayFields} />
          </div>
        </div>
        {!canEditPayFields && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-4">
            <Lock className="h-3 w-3" /> Contract type, IRD number and pay rates are managed by an administrator.
          </p>
        )}
      </ProfileSection>

      {/* Skills */}
      <ProfileSection title="Skills">
        <Input
          value={form.skillsText}
          onChange={e => set('skillsText', e.target.value)}
          placeholder="e.g. Working at height, First aid, Class 2 licence"
        />
        <p className="text-xs text-muted-foreground mt-2">Separate each skill with a comma.</p>
      </ProfileSection>

      {/* Emergency contact */}
      <ProfileSection title="Emergency Contact">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Contact Name</Label>
            <Input value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <Label>Contact Phone</Label>
            <Input value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} placeholder="+64 21 000 0000" />
          </div>
          <div className="space-y-2">
            <Label>Relationship</Label>
            <Input value={form.emergency_contact_relationship} onChange={e => set('emergency_contact_relationship', e.target.value)} placeholder="e.g. Partner" />
          </div>
        </div>
      </ProfileSection>

      <CustomFieldsSection
        fields={customFields}
        values={form.customFields}
        onChange={setCustomField}
        canEditAdminFields={canEditAdminFields}
      />

      <ProfilePhotoSection photos={form.photos} onChange={(photos) => set('photos', photos)} />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}