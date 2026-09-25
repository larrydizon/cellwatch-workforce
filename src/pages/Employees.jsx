import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Phone, Mail, UserPlus, ClipboardList, LayoutDashboard, Briefcase, User as UserIcon, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import EmployeeFormsModal from '@/components/employees/EmployeeFormsModal';
import EmployeeDashboardModal from '@/components/employees/EmployeeDashboardModal';
import AssignJobModal from '@/components/employees/AssignJobModal';
import EmployeeProfileModal from '@/components/employees/EmployeeProfileModal';
import InviteEmployeeModal from '@/components/employees/InviteEmployeeModal';
import ProfileFieldsModal from '@/components/employees/ProfileFieldsModal';
import UserLevelsModal from '@/components/employees/UserLevelsModal';
import { userLevelLabel, isAdminUser } from '@/lib/employeeProfile';

const roleBadgeColors = {
  admin: "bg-red-50 text-red-700 border-red-200",
  user: "bg-slate-50 text-slate-700 border-slate-200",
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
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [viewingDashboard, setViewingDashboard] = useState(null);
  const [assigningJobs, setAssigningJobs] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);

  const { data: employees = [], isLoading, isError } = useQuery({
    queryKey: ['employees', user?.organization_id],
    queryFn: () => base44.entities.Employee.filter({ organization_id: user.organization_id }, 'full_name', 200),
    enabled: !!user?.organization_id,
  });

  const { data: levels = [] } = useQuery({
    queryKey: ['user-levels', user?.organization_id],
    queryFn: () => base44.entities.UserLevel.filter({ organization_id: user.organization_id }, 'created_date', 100),
    enabled: !!user?.organization_id,
  });

  const isAdmin = isAdminUser(user, levels);

  // Directory records are read from the app's own entity so every admin can see
  // the team; id points at the linked user account for profile editing
  const orgUsers = employees.map(e => ({ ...e, id: e.user_id || e.id }));

  const filtered = orgUsers.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.job_title?.toLowerCase().includes(search.toLowerCase())
  );

  if (user && !isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-2">
        <ShieldCheck className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="font-semibold">Access restricted</p>
        <p className="text-sm text-muted-foreground">
          Only administrators and the company owner can view the employee directory.
        </p>
        <p className="text-xs text-muted-foreground pt-2">
          Signed in as {user.email} · {userLevelLabel(user, levels)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground mt-1">{orgUsers.length} team members</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={() => setLevelsOpen(true)} className="gap-2">
                <ShieldCheck className="h-4 w-4" /> User Levels
              </Button>
              <Button variant="outline" onClick={() => setFieldsOpen(true)} className="gap-2">
                <SlidersHorizontal className="h-4 w-4" /> Profile Fields
              </Button>
            </>
          )}
          <Button onClick={() => setInviteOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" /> Add Employee
          </Button>
        </div>
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
      ) : isError || filtered.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-16 space-y-3">
          <UserIcon className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="font-semibold">No employees to show</p>
          <p className="text-sm text-muted-foreground">
            {search
              ? 'No one matches your search.'
              : 'Add your first employee to build the team directory.'}
          </p>
          {!search && (
            <Button className="gap-2" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4" /> Add Employee
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp) => (
            <div key={emp.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {emp.photos?.[0] ? (
                    <img src={emp.photos[0]} alt={emp.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-primary font-semibold text-sm">
                      {emp.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{emp.full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground truncate">{emp.job_title || 'No title set'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={roleBadgeColors[emp.role] || ""}>
                      {userLevelLabel(emp, levels)}
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
                    onClick={() => setViewingProfile(emp)}
                  >
                    <UserIcon className="h-3.5 w-3.5" /> Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setViewingEmployee(emp)}
                  >
                    <ClipboardList className="h-3.5 w-3.5" /> Forms
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="col-span-2 gap-1.5"
                    onClick={() => setAssigningJobs(emp)}
                  >
                    <Briefcase className="h-3.5 w-3.5" /> Assign Job
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <InviteEmployeeModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        organizationId={user?.organization_id}
      />

      <ProfileFieldsModal
        open={fieldsOpen}
        onOpenChange={setFieldsOpen}
        organizationId={user?.organization_id}
      />

      <UserLevelsModal
        open={levelsOpen}
        onOpenChange={setLevelsOpen}
        organizationId={user?.organization_id}
      />

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

      {assigningJobs && (
        <AssignJobModal
          employee={assigningJobs}
          open={!!assigningJobs}
          onOpenChange={(v) => { if (!v) setAssigningJobs(null); }}
        />
      )}

      {viewingProfile && (
        <EmployeeProfileModal
          employee={viewingProfile}
          viewer={user}
          open={!!viewingProfile}
          onOpenChange={(v) => { if (!v) setViewingProfile(null); }}
        />
      )}
    </div>
  );
}