import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { LogIn, LogOut, LayoutDashboard, User, Briefcase, Clock, FileText } from 'lucide-react';
import moment from 'moment';
import StatCard from '@/components/dashboard/StatCard';
import TodayJobsList from '@/components/dashboard/TodayJobsList';
import FormsReminder from '@/components/dashboard/FormsReminder';
import WorkforceOverview from '@/components/dashboard/WorkforceOverview';
import OperationalBanner from '@/components/home/OperationalBanner';
import SubscriptionSeatPanel from '@/components/home/SubscriptionSeatPanel';
import AutomatedActionsPanel from '@/components/home/AutomatedActionsPanel';
import QuickTogglesPanel from '@/components/home/QuickTogglesPanel';
import AuditFeed from '@/components/audit/AuditFeed';
import InviteEmployeeModal from '@/components/employees/InviteEmployeeModal';
import useOrganization from '@/hooks/useOrganization';

export default function Dashboard() {
  const { user } = useOutletContext();
  const isAdmin = ['admin', 'operations_manager', 'supervisor'].includes(user?.role);
  const [viewMode, setViewMode] = useState('admin');
  const [inviteOpen, setInviteOpen] = useState(false);

  const orgState = useOrganization(user);
  const showAdminView = isAdmin && viewMode === 'admin';

  // ── Admin queries ──
  const { data: allTimeEntries = [] } = useQuery({
    queryKey: ['dashboard-time-entries'],
    queryFn: () => base44.entities.TimeEntry.list('-created_date', 50),
    enabled: showAdminView,
  });

  const { data: allJobs = [] } = useQuery({
    queryKey: ['dashboard-jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 50),
    enabled: showAdminView,
  });

  const { data: pendingTimesheets = [] } = useQuery({
    queryKey: ['dashboard-pending-timesheets'],
    queryFn: () => base44.entities.TimeEntry.filter({ status: 'pending_approval' }, '-created_date', 50),
    enabled: showAdminView,
  });

  const { data: allShifts = [] } = useQuery({
    queryKey: ['dashboard-all-shifts'],
    queryFn: () => base44.entities.Shift.list('-start_time', 200),
    enabled: showAdminView,
  });

  const { data: allLeaveRequests = [] } = useQuery({
    queryKey: ['dashboard-all-leaves'],
    queryFn: () => base44.entities.LeaveRequest.list('-created_date', 200),
    enabled: showAdminView,
  });

  // ── Employee queries ──
  const { data: myActiveEntry = [] } = useQuery({
    queryKey: ['my-active-entry', user?.email],
    queryFn: () => base44.entities.TimeEntry.filter({ employee_email: user.email, status: 'active' }, '-created_date', 1),
    enabled: !!user?.email && (!isAdmin || viewMode === 'employee'),
  });

  const { data: myJobs = [] } = useQuery({
    queryKey: ['my-jobs', user?.email],
    queryFn: () => base44.entities.Job.list('-created_date', 50),
    enabled: !!user?.email && (!isAdmin || viewMode === 'employee'),
  });

  const { data: myTimesheets = [] } = useQuery({
    queryKey: ['my-timesheets', user?.email],
    queryFn: () => base44.entities.TimeEntry.filter({ employee_email: user.email }, '-created_date', 20),
    enabled: !!user?.email && (!isAdmin || viewMode === 'employee'),
  });

  const clockedIn = myActiveEntry[0] || null;
  const myAssignedJobs = myJobs.filter((j) => j.assigned_workers?.includes(user?.email));
  const myTodayJobs = myAssignedJobs.filter((j) => j.start_date === moment().format('YYYY-MM-DD'));
  const myPendingTimesheets = myTimesheets.filter((t) => t.status === 'pending_approval');
  const todayHours = myTimesheets
    .filter((t) => moment(t.clock_in).isSame(moment(), 'day') && t.total_hours)
    .reduce((sum, t) => sum + t.total_hours, 0);

  const greeting = `Good ${moment().hour() < 12 ? 'morning' : moment().hour() < 17 ? 'afternoon' : 'evening'}, ${user?.full_name?.split(' ')[0] || 'there'}`;

  const ViewToggle = () => (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <button
        onClick={() => setViewMode('admin')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          viewMode === 'admin' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <LayoutDashboard className="h-3.5 w-3.5" /> Admin
      </button>
      <button
        onClick={() => setViewMode('employee')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          viewMode === 'employee' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <User className="h-3.5 w-3.5" /> My View
      </button>
    </div>
  );

  // ══ ADMIN VIEW — operational command floor ══
  if (showAdminView) {
    return (
      <div className="space-y-6">
        <OperationalBanner orgState={orgState} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-display">{greeting}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {moment().format('dddd, D MMMM YYYY')} — Operational command
            </p>
          </div>
          <ViewToggle />
        </div>

        {/* Top row — 60/40 */}
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <SubscriptionSeatPanel orgState={orgState} onAddSeat={() => setInviteOpen(true)} />
          <AutomatedActionsPanel organizationId={user?.organization_id} />
        </div>

        {/* Bottom row — 65/35 */}
        <div className="grid gap-6 lg:grid-cols-[13fr_7fr]">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="font-semibold text-sm">Recent Operational Audit Log</p>
            </div>
            <AuditFeed organizationId={user?.organization_id} limit={12} showFilters actorEmail={user?.email} />
          </div>
          <QuickTogglesPanel
            organizationId={user?.organization_id}
            settings={orgState.settings}
            actorEmail={user?.email}
          />
        </div>

        <WorkforceOverview
          allTimeEntries={allTimeEntries}
          allJobs={allJobs}
          pendingTimesheets={pendingTimesheets}
          allShifts={allShifts}
          allLeaveRequests={allLeaveRequests}
        />

        <InviteEmployeeModal open={inviteOpen} onOpenChange={setInviteOpen} organizationId={user?.organization_id} />
      </div>
    );
  }

  // ══ EMPLOYEE VIEW ══
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">{greeting}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {moment().format('dddd, D MMMM YYYY')}
          </p>
        </div>
        {isAdmin && <ViewToggle />}
      </div>

      <div className={`rounded-lg border p-5 flex items-center gap-4 ${clockedIn ? 'bg-success/5 border-success/20' : 'bg-muted/50 border-border'}`}>
        <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${clockedIn ? 'bg-success/10' : 'bg-muted'}`}>
          {clockedIn ? <LogIn className="h-6 w-6 text-success" /> : <LogOut className="h-6 w-6 text-muted-foreground" />}
        </div>
        <div className="flex-1">
          {clockedIn ? (
            <>
              <p className="font-semibold text-success">You're clocked in</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Since {moment(clockedIn.clock_in).format('h:mm A')}
                {clockedIn.job_title ? ` · ${clockedIn.job_title}` : ''}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">Not clocked in</p>
              <p className="text-sm text-muted-foreground mt-0.5">Head to Time Clock to start your shift</p>
            </>
          )}
        </div>
        {clockedIn && (
          <div className="flex items-center gap-1.5">
            <span className="pulse-dot bg-success" />
            <span className="text-xs font-medium text-success">Active</span>
          </div>
        )}
      </div>

      <FormsReminder user={user} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="My Jobs" value={myAssignedJobs.length} icon={Briefcase} color="blue" subtitle="Assigned" />
        <StatCard title="Today" value={myTodayJobs.length} icon={Briefcase} color="purple" subtitle="Scheduled" />
        <StatCard title="Hours Today" value={`${todayHours.toFixed(1)}h`} icon={Clock} color="success" subtitle="Logged" />
        <StatCard title="Pending" value={myPendingTimesheets.length} icon={FileText} color="warning" subtitle="Timesheets" />
      </div>

      <div className="bg-card rounded-lg border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Jobs Assigned to You</h2>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
            {myAssignedJobs.length} total
          </span>
        </div>
        <div className="p-4">
          <TodayJobsList jobs={myAssignedJobs} />
        </div>
      </div>
    </div>
  );
}