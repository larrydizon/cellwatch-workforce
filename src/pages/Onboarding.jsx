import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Briefcase } from 'lucide-react';
import { syncEmployeeRecord } from '@/lib/employeeDirectory';

export default function Onboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      if (u?.organization_id) { navigate('/', { replace: true }); return; }
      // If the user was invited to an organization, join it instead of creating a new one
      try {
        const orgs = await base44.entities.Organization.list('-created_date', 50);
        if (orgs.length) {
          const org = orgs.find(o => (o.member_emails || []).includes(u.email)) || orgs[0];
          await base44.auth.updateMe({ organization_id: org.id });
          // Apply the details the admin entered when they were added
          const pending = (org.pending_invites || []).find(p => p.email?.toLowerCase() === u.email?.toLowerCase());
          if (pending) {
            await base44.auth.updateMe({
              phone: pending.phone || '',
              position: pending.position || '',
              job_title: pending.job_title || '',
              user_level: pending.user_level || '',
            });
          }
          await syncEmployeeRecord(await base44.auth.me(), org.id);
          navigate('/', { replace: true });
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
      const org = await base44.entities.Organization.create({
        name: orgName.trim(),
        owner_email: user.email,
        member_emails: [user.email],
        plan: 'free',
        plan_status: 'trial',
        seat_limit: 5,
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });
      await base44.auth.updateMe({ organization_id: org.id });
      await syncEmployeeRecord(await base44.auth.me(), org.id);
      toast.success('Organization created');
      navigate('/', { replace: true });
    } catch (e) {
      toast.error('Failed to create organization');
    }
    setSubmitting(false);
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
            <span className="text-primary-foreground font-bold">CW</span>
          </div>
          <div>
            <p className="font-bold text-lg">Cellwatch Workforce</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Create your workspace</p>
          </div>
        </div>

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
            You'll start on a 14-day Free trial. Add billing anytime from the Billing page.
          </p>
        </div>
      </div>
    </div>
  );
}