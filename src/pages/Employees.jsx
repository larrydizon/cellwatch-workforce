import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, User as UserIcon, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import EmployeeCard from '@/components/employees/EmployeeCard';
import EmployeeListItem from '@/components/employees/EmployeeListItem';
import ViewToggle from '@/components/common/ViewToggle';
import EmployeeFormsModal from '@/components/employees/EmployeeFormsModal';
import EmployeeDashboardModal from '@/components/employees/EmployeeDashboardModal';
import AssignJobModal from '@/components/employees/AssignJobModal';
import EmployeeProfileModal from '@/components/employees/EmployeeProfileModal';
import InviteEmployeeModal from '@/components/employees/InviteEmployeeModal';
import ProfileFieldsModal from '@/components/employees/ProfileFieldsModal';
import UserLevelsModal from '@/components/employees/UserLevelsModal';
import RemoveEmployeeModal from '@/components/employees/RemoveEmployeeModal';
import { userLevelLabel, isAdminUser } from '@/lib/employeeProfile';

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
  const [removingEmployee, setRemovingEmployee] = useState(null);
  const [view, setView] = useState('grid');

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
  const orgUsers = employees.map(e => ({ ...e, id: e.user_id || e.id, directory_id: e.id }));

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
          <ViewToggle view={view} onChange={setView} />
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
      ) : view === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp) => (
            <EmployeeCard
              key={emp.id}
              emp={emp}
              levels={levels}
              isAdmin={isAdmin}
              onDashboard={setViewingDashboard}
              onProfile={setViewingProfile}
              onForms={setViewingEmployee}
              onAssignJob={setAssigningJobs}
              onRemove={setRemovingEmployee}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((emp) => (
            <EmployeeListItem
              key={emp.id}
              emp={emp}
              levels={levels}
              isAdmin={isAdmin}
              onDashboard={setViewingDashboard}
              onProfile={setViewingProfile}
              onForms={setViewingEmployee}
              onAssignJob={setAssigningJobs}
              onRemove={setRemovingEmployee}
            />
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

      {removingEmployee && (
        <RemoveEmployeeModal
          employee={removingEmployee}
          organizationId={user?.organization_id}
          open={!!removingEmployee}
          onOpenChange={(v) => { if (!v) setRemovingEmployee(null); }}
        />
      )}
    </div>
  );
}