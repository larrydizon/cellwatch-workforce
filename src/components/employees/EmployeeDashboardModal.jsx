import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, Briefcase, FileText, LogIn, LogOut } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import TodayJobsList from '@/components/dashboard/TodayJobsList';
import moment from 'moment';

export default function EmployeeDashboardModal({ employee, open, onOpenChange }) {
  const email = employee?.email;

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['emp-dash-entries', email],
    queryFn: () => base44.entities.TimeEntry.filter({ employee_email: email }, '-created_date', 30),
    enabled: !!email && open,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['emp-dash-jobs', email],
    queryFn: () => base44.entities.Job.list('-created_date', 100),
    enabled: !!email && open,
  });

  const activeEntry = timeEntries.find(t => t.status === 'active');
  const assignedJobs = jobs.filter(j => j.assigned_workers?.includes(email));
  const todayJobs = assignedJobs.filter(j => j.start_date === moment().format('YYYY-MM-DD'));
  const pendingTimesheets = timeEntries.filter(t => t.status === 'pending_approval');
  const todayHours = timeEntries
    .filter(t => moment(t.clock_in).isSame(moment(), 'day') && t.total_hours)
    .reduce((sum, t) => sum + t.total_hours, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee?.full_name || email} — Dashboard</DialogTitle>
          <p className="text-sm text-muted-foreground">{moment().format('dddd, D MMMM YYYY')}</p>
        </DialogHeader>

        {/* Clock status banner */}
        <div className={`rounded-xl border p-4 flex items-center gap-4 ${activeEntry ? 'bg-success/5 border-success/20' : 'bg-muted/50 border-border'}`}>
          <div className={`h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0 ${activeEntry ? 'bg-success/10' : 'bg-muted'}`}>
            {activeEntry ? <LogIn className="h-5 w-5 text-success" /> : <LogOut className="h-5 w-5 text-muted-foreground" />}
          </div>
          <div className="flex-1">
            {activeEntry ? (
              <>
                <p className="font-semibold text-success">Clocked in</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Since {moment(activeEntry.clock_in).format('h:mm A')}
                  {activeEntry.job_title ? ` · ${activeEntry.job_title}` : ''}
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">Not clocked in</p>
                <p className="text-sm text-muted-foreground mt-0.5">No active shift</p>
              </>
            )}
          </div>
          {activeEntry && (
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-success">Active</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard title="Jobs" value={assignedJobs.length} icon={Briefcase} color="blue" subtitle="Assigned" />
          <StatCard title="Today" value={todayJobs.length} icon={Briefcase} color="purple" subtitle="Scheduled" />
          <StatCard title="Hours Today" value={`${todayHours.toFixed(1)}h`} icon={Clock} color="success" subtitle="Logged" />
          <StatCard title="Pending" value={pendingTimesheets.length} icon={FileText} color="warning" subtitle="Timesheets" />
        </div>

        {/* Assigned jobs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Assigned Jobs</h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">{assignedJobs.length} total</span>
          </div>
          <TodayJobsList jobs={assignedJobs} />
        </div>
      </DialogContent>
    </Dialog>
  );
}