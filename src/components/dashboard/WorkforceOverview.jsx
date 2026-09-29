import React from 'react';
import { Clock, Briefcase, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import moment from 'moment';
import StatCard from '@/components/dashboard/StatCard';
import ActiveWorkersList from '@/components/dashboard/ActiveWorkersList';
import TodayJobsList from '@/components/dashboard/TodayJobsList';
import AdminCalendar from '@/components/dashboard/AdminCalendar';
import LiveFieldMap from '@/components/dashboard/LiveFieldMap';
import ForceClockOut from '@/components/dashboard/ForceClockOut';

// The workforce side of the admin home: who is on site, what is scheduled today,
// the live map and the manual clock-out controls.
export default function WorkforceOverview({
  allTimeEntries = [],
  allJobs = [],
  pendingTimesheets = [],
  allShifts = [],
  allLeaveRequests = [],
}) {
  const activeWorkers = allTimeEntries.filter((t) => t.status === 'active');
  const todayJobs = allJobs.filter((j) => j.start_date === moment().format('YYYY-MM-DD'));
  const completedToday = allJobs.filter((j) => j.status === 'completed' && j.end_date === moment().format('YYYY-MM-DD'));
  const overtimeEntries = allTimeEntries.filter((t) => t.is_overtime);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Clocked In" value={activeWorkers.length} icon={Clock} color="success" subtitle="Active now" />
        <StatCard title="Today's Jobs" value={todayJobs.length} icon={Briefcase} color="blue" subtitle="Scheduled" />
        <StatCard title="Completed" value={completedToday.length} icon={CheckCircle2} color="success" subtitle="Today" />
        <StatCard title="Pending Approval" value={pendingTimesheets.length} icon={FileText} color="warning" subtitle="Timesheets" />
        <StatCard title="Overtime" value={overtimeEntries.length} icon={AlertTriangle} color="destructive" subtitle="This period" />
        <StatCard title="Total Jobs" value={allJobs.length} icon={Briefcase} color="purple" subtitle="All time" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Active Workers</h2>
            <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium">
              {activeWorkers.length} clocked in
            </span>
          </div>
          <div className="p-4">
            <ActiveWorkersList timeEntries={allTimeEntries} />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Today's Jobs</h2>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
              {todayJobs.length} scheduled
            </span>
          </div>
          <div className="p-4">
            <TodayJobsList jobs={todayJobs} />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Live Field Map</h2>
          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium flex items-center gap-1">
            <span className="pulse-dot bg-success" />
            {activeWorkers.length} active
          </span>
        </div>
        <div className="p-4">
          <LiveFieldMap timeEntries={allTimeEntries} />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Force Clock-Out</h2>
          <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full font-medium">
            Admin only
          </span>
        </div>
        <div className="p-4">
          <ForceClockOut timeEntries={allTimeEntries} />
        </div>
      </div>

      <AdminCalendar shifts={allShifts} leaveRequests={allLeaveRequests} />
    </div>
  );
}