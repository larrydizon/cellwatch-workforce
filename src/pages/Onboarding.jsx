import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Briefcase, Upload } from 'lucide-react';
import { syncEmployeeRecord } from '@/lib/employeeDirectory';
import { runOrganizationCommand } from '@/lib/organizations';
import { PLANS } from '@/lib/plans';
import CompanyLogo from '@/components/layout/CompanyLogo';

export default function Onboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Step two: the company identity, shown right after the workspace is created.
  const [org, setOrg] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [uploading, setUploading] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  // The plan chosen on the public pricing page, carried through sign-up.
  const selectedPlan = new URLSearchParams(window.location.search).get('plan')
    || localStorage.getItem('signup_plan')
    || 'free';
  const selectedPlanName = (PLANS.find(p => p.key === selectedPlan) || PLANS[0]).name;

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      if (u?.organization_id) { navigate('/dashboard', { replace: true }); return; }
      // If the user was invited to an organization, join it instead of creating a new one
      try {
        const response = await base44.functions.invoke('organizationCommand', { action: 'claim_invite' });
        const invitedOrg = response?.data?.organization;
        const pending = response?.data?.invite;
        if (invitedOrg?.id) {
          await base44.auth.updateMe({ organization_id: invitedOrg.id });
          // Apply the details the admin entered when they were added
          if (pending) {
            await base44.auth.updateMe({
              phone: pending.phone || '',
              position: pending.position || '',
              job_title: pending.job_title || '',
              user_level: pending.user_level || '',
            });
          }
          await syncEmployeeRecord(await base44.auth.me(), invitedOrg.id);
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (e) {
        // fall through to workspace creation
      }
      setLoading(false);
    }).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const handleSubmit = async () => {
    if (!orgName.trim()) { toast.error('Enter an organization name'); return; }
    setSubmitting(true);
    try {
      const created = await runOrganizationCommand('create_workspace', { name: orgName.trim(), plan: selectedPlan });
      localStorage.removeItem('signup_plan');
      await base44.auth.updateMe({ organization_id: created.id });
      await syncEmployeeRecord(await base44.auth.me(), created.id);
      setOrg(created);
      setCompanyName(created.name || orgName.trim());
      setDescription(created.description || '');
      setLogo(created.logo || '');
      setSubmitting(false);
    } catch (e) {
      toast.error('Failed to create organization');
      setSubmitting(false);
    }
  };

  const handleLogoUpload = async (event) => {
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

  const saveCompany = async () => {
    if (!companyName.trim()) { toast.error('Enter your company name'); return; }
    setSavingCompany(true);
    try {
      await runOrganizationCommand('update', {
        changes: { name: companyName.trim(), logo, description: description.trim() },
      });
      toast.success('Company saved');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      toast.error('Could not save company details');
      setSavingCompany(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-lg">{org ? 'Set up your company' : 'Create your workspace'}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              {org ? 'Step 2 of 2' : 'Step 1 of 2'}
            </p>
          </div>
        </div>

        {!org ? (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Welcome, {user?.full_name?.split(' ')[0] || 'there'}!</h1>
              <p className="text-sm text-muted-foreground mt-1">Name your organization to get started.</p>
            </div>

            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input
                placeholder="e.g. Acme Construction Ltd"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
            </div>

            <Button onClick={handleSubmit} disabled={submitting} className="w-full h-11">
              {submitting ? 'Creating...' : 'Create Organization'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              You'll start on a 14-day {selectedPlanName} trial — no payment taken. Add billing anytime from the Billing page.
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="text-center">
              <CompanyLogo org={{ name: companyName, logo }} className="h-16 w-16 mx-auto mb-3" textClassName="text-xl" />
              <h1 className="text-xl font-bold">Make it yours</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Your company name and logo appear throughout the app.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} autoFocus />
            </div>

            <div className="space-y-2">
              <Label>Company Logo</Label>
              <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-dashed border-border px-4 py-3 hover:bg-accent/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Upload className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{logo ? 'Replace logo' : 'Upload logo'}</p>
                  <p className="text-xs text-muted-foreground">PNG or JPG, square works best</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
              </label>
              {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="A short line about your company"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <Button onClick={saveCompany} disabled={savingCompany || uploading} className="w-full h-11">
              {savingCompany ? 'Saving...' : 'Save and continue'}
            </Button>
            <button
              onClick={() => navigate('/dashboard', { replace: true })}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}