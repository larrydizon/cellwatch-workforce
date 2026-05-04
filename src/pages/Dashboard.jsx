import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import {
  Users, Clock, Briefcase, AlertTriangle, CheckCircle2, FileText
} from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import ActiveWorkersList from '@/components/dashboard/ActiveWorkersList';
import TodayJobsList from '@/components/dashboard/TodayJobsList';
import moment from 'moment';

export default function Dashboard() {
  const { user } = useOutletContext();
  const today = moment().startOf('day').toISOString();

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['dashboard-time-entries'],
    queryFn: () => base44.entities.TimeEntry.list('-created_date', 50),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['dashboard-jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 50),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['dashboard-shifts'],
    queryFn: () => base44.entities.Shift.list('-start_time', 50),
  });

  const { data: pendingTimesheets = [] } = useQuery({
    queryKey: ['dashboard-pending-timesheets'],
    queryFn: () => base44.entities.TimeEntry.filter({ status: 'pending_approval' }, '-created_date', 50),
  });

  const activeWorkers = timeEntries.filter(t => t.status === 'active');
  const todayJobs = jobs.filter(j => j.start_date === moment().format('YYYY-MM-DD'));
  const completedToday = jobs.filter(j => j.status === 'completed' && j.end_date === moment().format('YYYY-MM-DD'));
  const overtimeEntries = timeEntries.filter(t => t.is_overtime);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Good {moment().hour() < 12 ? 'morning' : moment().hour() < 17 ? 'afternoon' : 'evening'}, {user?.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {moment().format('dddd, D MMMM YYYY')} — Here's your workforce overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Clocked In" value={activeWorkers.length} icon={Clock} color="success" subtitle="Active now" />
        <StatCard title="Today's Jobs" value={todayJobs.length} icon={Briefcase} color="blue" subtitle="Scheduled" />
        <StatCard title="Completed" value={completedToday.length} icon={CheckCircle2} color="success" subtitle="Today" />
        <StatCard title="Pending Approval" value={pendingTimesheets.length} icon={FileText} color="warning" subtitle="Timesheets" />
        <StatCard title="Overtime" value={overtimeEntries.length} icon={AlertTriangle} color="destructive" subtitle="This period" />
        <StatCard title="Total Jobs" value={jobs.length} icon={Briefcase} color="purple" subtitle="All time" />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Workers */}
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
            <ActiveWorkersList timeEntries={timeEntries} />
          </div>
        </div>

        {/* Today's Jobs */}
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
    </div>
  );
}