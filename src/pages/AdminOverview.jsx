import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar, Briefcase, UmbrellaOff, Clock, MapPin, User,
  Check, X, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';

const shiftStatusColors = {
  scheduled:        'bg-blue-50 text-blue-700 border-blue-200',
  accepted:         'bg-emerald-50 text-emerald-700 border-emerald-200',
  declined:         'bg-red-50 text-red-700 border-red-200',
  change_requested: 'bg-amber-50 text-amber-700 border-amber-200',
  completed:        'bg-slate-50 text-slate-700 border-slate-200',
  cancelled:        'bg-red-50 text-red-400 border-red-200',
};

const jobStatusColors = {
  new:        'bg-slate-50 text-slate-600 border-slate-200',
  scheduled:  'bg-blue-50 text-blue-700 border-blue-200',
  in_progress:'bg-emerald-50 text-emerald-700 border-emerald-200',
  waiting:    'bg-amber-50 text-amber-700 border-amber-200',
  completed:  'bg-slate-50 text-slate-500 border-slate-200',
  cancelled:  'bg-red-50 text-red-400 border-red-200',
  invoiced:   'bg-violet-50 text-violet-700 border-violet-200',
};

const leaveTypeLabels = {
  annual:      'Annual Leave',
  sick:        'Sick Leave',
  bereavement: 'Bereavement',
  unpaid:      'Unpaid Leave',
  other:       'Other',
};

export default function AdminOverview() {
  const { user } = useOutletContext();
  const [shiftRange, setShiftRange] = useState('week');
  const [jobFilter, setJobFilter] = useState('active');
  const [expandedLeave, setExpandedLeave] = useState(null);
  const queryClient = useQueryClient();

  const isAdmin = ['admin', 'operations_manager', 'supervisor'].includes(user?.role);

  // Shifts
  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ['overview-shifts', shiftRange],
    queryFn: () => base44.entities.Shift.list('-start_time', 200),
  });

  // Jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['overview-jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 200),
  });

  // Leave requests
  const { data: leaveRequests = [], isLoading: leaveLoading } = useQuery({
    queryKey: ['overview-leave'],
    queryFn: () => base44.entities.LeaveRequest.filter({ status: 'pending' }, '-created_date', 100),
  });

  const approveLeaveMutation = useMutation({
    mutationFn: (id) => base44.entities.LeaveRequest.update(id, {
      status: 'approved',
      reviewed_by: user?.email,
      reviewed_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overview-leave'] });
      toast.success('Leave approved');
    },
  });

  const declineLeaveMutation = useMutation({
    mutationFn: (id) => base44.entities.LeaveRequest.update(id, {
      status: 'declined',
      reviewed_by: user?.email,
      reviewed_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overview-leave'] });
      toast.success('Leave declined');
    },
  });

  // Filter shifts by range
  const now = moment();
  const filteredShifts = shifts.filter(s => {
    const start = moment(s.start_time);
    if (shiftRange === 'today') return start.isSame(now, 'day');
    if (shiftRange === 'week') return start.isBetween(now.clone().startOf('isoWeek'), now.clone().endOf('isoWeek'), null, '[]');
    if (shiftRange === 'upcoming') return start.isAfter(now);
    return true;
  });

  // Filter jobs
  const filteredJobs = jobs.filter(j => {
    if (jobFilter === 'active') return ['new', 'scheduled', 'in_progress', 'waiting'].includes(j.status);
    if (jobFilter === 'completed') return j.status === 'completed';
    return true;
  });

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Central view of shifts, jobs, and leave requests</p>
      </div>

      {/* Summary Pills */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-4 py-1.5 text-sm font-medium">
          <Calendar className="h-4 w-4" />
          {filteredShifts.length} shifts
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-4 py-1.5 text-sm font-medium">
          <Briefcase className="h-4 w-4" />
          {filteredJobs.length} {jobFilter === 'active' ? 'active' : jobFilter} jobs
        </div>
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-4 py-1.5 text-sm font-medium">
          <UmbrellaOff className="h-4 w-4" />
          {leaveRequests.length} pending leave
        </div>
      </div>

      {/* Three-column grid on large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── SHIFTS ── */}
        <div className="bg-card border border-border rounded-xl flex flex-col">
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-semibold">
                <Calendar className="h-4 w-4 text-blue-600" /> Shifts
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['overview-shifts'] })}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Tabs value={shiftRange} onValueChange={setShiftRange}>
              <TabsList className="h-8 text-xs">
                <TabsTrigger value="today" className="text-xs">Today</TabsTrigger>
                <TabsTrigger value="week" className="text-xs">This Week</TabsTrigger>
                <TabsTrigger value="upcoming" className="text-xs">Upcoming</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[520px] divide-y divide-border">
            {shiftsLoading && <p className="text-sm text-muted-foreground p-5">Loading...</p>}
            {!shiftsLoading && filteredShifts.length === 0 && (
              <p className="text-sm text-muted-foreground p-5 text-center">No shifts found</p>
            )}
            {filteredShifts.map(shift => (
              <div key={shift.id} className="p-4 hover:bg-accent/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{shift.title}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{shift.assigned_name || shift.assigned_to}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span>{moment(shift.start_time).format('ddd D MMM, h:mm A')} – {moment(shift.end_time).format('h:mm A')}</span>
                    </div>
                    {shift.site_address && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{shift.site_address}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className={`flex-shrink-0 text-[10px] px-1.5 py-0 ${shiftStatusColors[shift.status]}`}>
                    {shift.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── JOBS ── */}
        <div className="bg-card border border-border rounded-xl flex flex-col">
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-semibold">
                <Briefcase className="h-4 w-4 text-emerald-600" /> Jobs
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['overview-jobs'] })}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Tabs value={jobFilter} onValueChange={setJobFilter}>
              <TabsList className="h-8 text-xs">
                <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
                <TabsTrigger value="completed" className="text-xs">Completed</TabsTrigger>
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[520px] divide-y divide-border">
            {jobsLoading && <p className="text-sm text-muted-foreground p-5">Loading...</p>}
            {!jobsLoading && filteredJobs.length === 0 && (
              <p className="text-sm text-muted-foreground p-5 text-center">No jobs found</p>
            )}
            {filteredJobs.map(job => (
              <div key={job.id} className="p-4 hover:bg-accent/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{job.title}</p>
                    {job.job_number && (
                      <p className="text-xs text-muted-foreground mt-0.5">#{job.job_number}</p>
                    )}
                    {job.client_name && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{job.client_name}</span>
                      </div>
                    )}
                    {job.site_address && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{job.site_address}</span>
                      </div>
                    )}
                    {job.assigned_workers?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {job.assigned_workers.length} worker{job.assigned_workers.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${jobStatusColors[job.status]}`}>
                      {job.status?.replace(/_/g, ' ')}
                    </Badge>
                    {job.priority === 'urgent' && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-200">urgent</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── LEAVE REQUESTS ── */}
        <div className="bg-card border border-border rounded-xl flex flex-col">
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <UmbrellaOff className="h-4 w-4 text-amber-600" /> Pending Leave
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['overview-leave'] })}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[520px] divide-y divide-border">
            {leaveLoading && <p className="text-sm text-muted-foreground p-5">Loading...</p>}
            {!leaveLoading && leaveRequests.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <UmbrellaOff className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm font-medium">No pending requests</p>
              </div>
            )}
            {leaveRequests.map(req => (
              <div key={req.id} className="p-4 hover:bg-accent/40 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{req.employee_name || req.employee_email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{leaveTypeLabels[req.leave_type] || req.leave_type}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {moment(req.start_date).format('D MMM')} – {moment(req.end_date).format('D MMM YYYY')}
                      {req.days_requested ? ` · ${req.days_requested} day${req.days_requested !== 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                  <button
                    className="text-muted-foreground hover:text-foreground flex-shrink-0 mt-0.5"
                    onClick={() => setExpandedLeave(expandedLeave === req.id ? null : req.id)}
                  >
                    {expandedLeave === req.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {expandedLeave === req.id && req.reason && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2 mb-3 leading-relaxed">
                    {req.reason}
                  </p>
                )}

                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1.5 bg-success hover:bg-success/90 text-success-foreground"
                    disabled={approveLeaveMutation.isPending}
                    onClick={() => approveLeaveMutation.mutate(req.id)}
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
                    disabled={declineLeaveMutation.isPending}
                    onClick={() => declineLeaveMutation.mutate(req.id)}
                  >
                    <X className="h-3.5 w-3.5" /> Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}