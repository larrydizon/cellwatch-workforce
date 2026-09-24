import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Search, Phone, Mail, UserPlus, ClipboardList, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';
import EmployeeFormsModal from '@/components/employees/EmployeeFormsModal';
import EmployeeDashboardModal from '@/components/employees/EmployeeDashboardModal';

const roleLabels = {
  admin: 'Admin',
  operations_manager: 'Ops Manager',
  supervisor: 'Supervisor',
  technician: 'Technician',
  casual_worker: 'Casual',
  client_viewer: 'Client Viewer',
};

const roleBadgeColors = {
  admin: "bg-red-50 text-red-700 border-red-200",
  operations_manager: "bg-violet-50 text-violet-700 border-violet-200",
  supervisor: "bg-blue-50 text-blue-700 border-blue-200",
  technician: "bg-emerald-50 text-emerald-700 border-emerald-200",
  casual_worker: "bg-amber-50 text-amber-700 border-amber-200",
  client_viewer: "bg-slate-50 text-slate-700 border-slate-200",
};

const empTypeLabels = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  casual: 'Casual',
  subcontractor: 'Subcontractor',
};

export default function Employees() {
  const { user } = useOutletContext();
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('technician');
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [viewingDashboard, setViewingDashboard] = useState(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.User.list('full_name', 200),
  });

  // Only show employees belonging to the current organization
  const orgUsers = users.filter(u => u.organization_id === user?.organization_id);

  const filtered = orgUsers.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.job_title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async () => {
    if (!inviteEmail) return;
    const appRole = ['admin', 'operations_manager'].includes(inviteRole) ? 'admin' : 'user';
    await base44.users.inviteUser(inviteEmail, appRole);
    // Add the invitee to this organization so they join the same workspace on accepting
    try {
      const org = await base44.entities.Organization.get(user.organization_id);
      if (org && !(org.member_emails || []).includes(inviteEmail)) {
        await base44.entities.Organization.update(org.id, {
          member_emails: [...(org.member_emails || []), inviteEmail],
        });
      }
    } catch (e) {
      // invite is still sent; org membership can be granted later
    }
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteOpen(false);
    setInviteEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground mt-1">{orgUsers.length} team members</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" /> Invite Employee
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Employee Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp) => (
            <div key={emp.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold text-sm">
                    {emp.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{emp.full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground truncate">{emp.job_title || 'No title set'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={roleBadgeColors[emp.role] || ""}>
                      {roleLabels[emp.role] || emp.role}
                    </Badge>
                    {emp.employment_type && (
                      <Badge variant="outline" className="text-xs">
                        {empTypeLabels[emp.employment_type] || emp.employment_type}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border space-y-1.5">
                {emp.email && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" /> <span className="truncate">{emp.email}</span>
                  </div>
                )}
                {emp.phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" /> {emp.phone}
                  </div>
                )}
                {emp.team && (
                  <p className="text-xs text-muted-foreground">Team: {emp.team}</p>
                )}
              </div>
              {emp.email && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setViewingDashboard(emp)}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setViewingEmployee(emp)}
                  >
                    <ClipboardList className="h-3.5 w-3.5" /> Forms
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                placeholder="employee@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operations_manager">Operations Manager</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                  <SelectItem value="casual_worker">Casual Worker</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={!inviteEmail}>Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {viewingEmployee && (
        <EmployeeFormsModal
          employee={viewingEmployee}
          open={!!viewingEmployee}
          onOpenChange={(v) => { if (!v) setViewingEmployee(null); }}
        />
      )}

      {viewingDashboard && (
        <EmployeeDashboardModal
          employee={viewingDashboard}
          open={!!viewingDashboard}
          onOpenChange={(v) => { if (!v) setViewingDashboard(null); }}
        />
      )}
    </div>
  );
}