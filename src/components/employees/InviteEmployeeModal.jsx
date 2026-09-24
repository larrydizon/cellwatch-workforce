import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { POSITIONS } from '@/components/forms/IndustryTemplates';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'operations_manager', label: 'Operations Manager' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'technician', label: 'Technician' },
  { value: 'casual_worker', label: 'Casual Worker' },
];

const EMPTY = { full_name: '', email: '', role: 'technician', phone: '', position: '', job_title: '' };

export default function InviteEmployeeModal({ open, onOpenChange, organizationId }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleInvite = async () => {
    const email = form.email.trim();
    if (!email) return;
    setSending(true);
    try {
      const appRole = ['admin', 'operations_manager'].includes(form.role) ? 'admin' : 'user';
      await base44.users.inviteUser(email, appRole);

      const details = {
        phone: form.phone,
        position: form.position,
        job_title: form.job_title,
      };

      const users = await base44.entities.User.list('-created_date', 200);
      const existing = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (existing) {
        // Already registered — apply the details straight away
        await base44.entities.User.update(existing.id, {
          ...details,
          organization_id: organizationId,
          role: appRole,
          ...(form.full_name ? { full_name: form.full_name } : {}),
        });
      } else {
        // Keep the details on the organization so they're applied when they accept
        const org = await base44.entities.Organization.get(organizationId);
        const pending = (org.pending_invites || []).filter(p => p.email?.toLowerCase() !== email.toLowerCase());
        await base44.entities.Organization.update(org.id, {
          member_emails: [...new Set([...(org.member_emails || []), email])],
          pending_invites: [...pending, { email, full_name: form.full_name, role: appRole, ...details }],
        });
      }

      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(`Invitation sent to ${email}`);
      setForm(EMPTY);
      onOpenChange(false);
    } catch {
      toast.error('Could not send the invitation');
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setForm(EMPTY); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <DialogDescription>Enter their details and we'll send the login invite.</DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-4 py-2">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Jane Smith" />
          </div>
          <div className="space-y-2">
            <Label>Email Address *</Label>
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="employee@email.com" />
          </div>
          <div className="space-y-2">
            <Label>User Level</Label>
            <Select value={form.role} onValueChange={v => set('role', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+64 21 000 0000" />
          </div>
          <div className="space-y-2">
            <Label>Position</Label>
            <Select value={form.position || ' '} onValueChange={v => set('position', v === ' ' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Select position..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Not specified</SelectItem>
                {POSITIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Job Title</Label>
            <Input value={form.job_title} onChange={e => set('job_title', e.target.value)} placeholder="e.g. Senior Technician" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleInvite} disabled={sending || !form.email.trim()}>
            {sending ? 'Sending...' : 'Send Invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}