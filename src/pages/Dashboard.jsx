import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import {
  Clock, Briefcase, AlertTriangle, CheckCircle2, FileText, LogIn, LogOut, LayoutDashboard, User
} from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import ActiveWorkersList from '@/components/dashboard/ActiveWorkersList';
import TodayJobsList from '@/components/dashboard/TodayJobsList';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import AdminCalendar from '@/components/dashboard/AdminCalendar';
import LiveFieldMap from '@/components/dashboard/LiveFieldMap';

export default function Dashboard() {
  const { user } = useOutletContext();
  const isAdmin = ['admin', 'operations_manager', 'supervisor'].includes(user?.role);
  const [viewMode, setViewMode] = useState('admin'); // 'admin' | 'employee' — only relevant for admins

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

  // ── Employee queries (always fetch for admins too when in employee view) ──
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

  // ── Admin derived ──
  const activeWorkers = allTimeEntries.filter(t => t.status === 'active');
  const todayJobs = allJobs.filter(j => j.start_date === moment().format('YYYY-MM-DD'));
  const completedToday = allJobs.filter(j => j.status === 'completed' && j.end_date === moment().format('YYYY-MM-DD'));
  const overtimeEntries = allTimeEntries.filter(t => t.is_overtime);

  // ── Employee derived ──
  const clockedIn = myActiveEntry[0] || null;
  const myAssignedJobs = myJobs.filter(j => j.assigned_workers?.includes(user?.email));
  const myTodayJobs = myAssignedJobs.filter(j => j.start_date === moment().format('YYYY-MM-DD'));
  const myPendingTimesheets = myTimesheets.filter(t => t.status === 'pending_approval');
  const todayHours = myTimesheets
    .filter(t => moment(t.clock_in).isSame(moment(), 'day') && t.total_hours)
    .reduce((sum, t) => sum + t.total_hours, 0);

  const greeting = `Good ${moment().hour() < 12 ? 'morning' : moment().hour() < 17 ? 'afternoon' : 'evening'}, ${user?.full_name?.split(' ')[0] || 'there'}`;

  // ── View toggle (admin only) ──
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

  // ══ ADMIN VIEW ══
  if (showAdminView) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{greeting}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {moment().format('dddd, D MMMM YYYY')} — Workforce overview
            </p>
          </div>
          <ViewToggle />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Clocked In" value={activeWorkers.length} icon={Clock} color="success" subtitle="Active now" />
          <StatCard title="Today's Jobs" value={todayJobs.length} icon={Briefcase} color="blue" subtitle="Scheduled" />
          <StatCard title="Completed" value={completedToday.length} icon={CheckCircle2} color="success" subtitle="Today" />
          <StatCard title="Pending Approval" value={pendingTimesheets.length} icon={FileText} color="warning" subtitle="Timesheets" />
          <StatCard title="Overtime" value={overtimeEntries.length} icon={AlertTriangle} color="destructive" subtitle="This period" />
          <StatCard title="Total Jobs" value={allJobs.length} icon={Briefcase} color="purple" subtitle="All time" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border">
            <div className="p-5 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Active Workers</h2>
                <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium">
                  {activeWorkers.length} clocked in
                </span>
              </div>
            </div>
            <div className="p-4">
              <ActiveWorkersList timeEntries={allTimeEntries} />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border">
            <div className="p-5 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Today's Jobs</h2>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                  {todayJobs.length} scheduled
                </span>
              </div>
            </div>
            <div className="p-4">
              <TodayJobsList jobs={todayJobs} />
            </div>
          </div>
        </div>

        {/* Live Field Map */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Live Field Map</h2>
              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse inline-block" />
                {allTimeEntries.filter(t => t.status === 'active').length} active
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Most recent clock-in location of all active technicians</p>
          </div>
          <div className="p-4">
            <LiveFieldMap timeEntries={allTimeEntries} />
          </div>
        </div>

        <AdminCalendar shifts={allShifts} leaveRequests={allLeaveRequests} />
      </div>
    );
  }

  // ══ EMPLOYEE VIEW (also shown to admins when they switch to "My View") ══
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {moment().format('dddd, D MMMM YYYY')}
          </p>
        </div>
        {isAdmin && <ViewToggle />}
      </div>

      {/* Clock status banner */}
      <div className={`rounded-xl border p-5 flex items-center gap-4 ${clockedIn ? 'bg-success/5 border-success/20' : 'bg-muted/50 border-border'}`}>
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
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-success">Active</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="My Jobs" value={myAssignedJobs.length} icon={Briefcase} color="blue" subtitle="Assigned" />
        <StatCard title="Today" value={myTodayJobs.length} icon={Briefcase} color="purple" subtitle="Scheduled" />
        <StatCard title="Hours Today" value={`${todayHours.toFixed(1)}h`} icon={Clock} color="success" subtitle="Logged" />
        <StatCard title="Pending" value={myPendingTimesheets.length} icon={FileText} color="warning" subtitle="Timesheets" />
      </div>

      {/* My Jobs */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Jobs Assigned to You</h2>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
              {myAssignedJobs.length} total
            </span>
          </div>
        </div>
        <div className="p-4">
          <TodayJobsList jobs={myAssignedJobs} />
        </div>
      </div>
    </div>
  );
}