import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, Shield, Briefcase, LogOut, Save } from 'lucide-react';
import { toast } from 'sonner';

const roleLabels = {
  admin: 'Administrator',
  operations_manager: 'Operations Manager',
  supervisor: 'Supervisor / Team Leader',
  technician: 'Field Technician',
  casual_worker: 'Casual / Subcontractor',
  client_viewer: 'Client Viewer',
};

export default function Profile() {
  const { user } = useOutletContext();
  const [form, setForm] = useState({
    phone: '', job_title: '', team: '', emergency_contact_name: '', emergency_contact_phone: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        phone: user.phone || '',
        job_title: user.job_title || '',
        team: user.team || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    toast.success('Profile updated');
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-xl">
                {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold">{user?.full_name || 'User'}</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  {roleLabels[user?.role] || user?.role || 'User'}
                </Badge>
                {user?.employment_type && (
                  <Badge variant="outline">{user.employment_type.replace(/_/g, ' ')}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+64 21 000 0000" />
            </div>
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} placeholder="e.g. Senior Technician" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Team</Label>
            <Input value={form.team} onChange={e => setForm({ ...form, team: e.target.value })} placeholder="e.g. Fibre Crew A" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input value={form.emergency_contact_name} onChange={e => setForm({ ...form, emergency_contact_name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input value={form.emergency_contact_phone} onChange={e => setForm({ ...form, emergency_contact_phone: e.target.value })} placeholder="+64 21 000 0000" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={() => base44.auth.logout()}>
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </div>
    </div>
  );
}