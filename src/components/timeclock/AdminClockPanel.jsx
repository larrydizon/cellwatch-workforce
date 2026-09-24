import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, LogOut, UserCog } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';

function currentLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null)
    );
  });
}

export default function AdminClockPanel({ user }) {
  const queryClient = useQueryClient();
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [jobId, setJobId] = useState('');

  const { data: employees = [] } = useQuery({
    queryKey: ['admin-clock-employees'],
    queryFn: () => base44.entities.User.list('full_name', 200),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['admin-clock-jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 200),
  });

  const employee = employees.find(e => e.email === employeeEmail) || null;
  const employeeName = employee?.full_name || employee?.email || '';

  const { data: activeEntry } = useQuery({
    queryKey: ['admin-clock-active', employeeEmail],
    queryFn: async () => {
      const entries = await base44.entities.TimeEntry.filter(
        { employee_email: employeeEmail, status: 'active' }, '-created_date', 1
      );
      return entries[0] || null;
    },
    enabled: !!employeeEmail,
  });

  const employeeJobs = jobs.filter(j =>
    !['completed', 'cancelled', 'invoiced'].includes(j.status) &&
    (j.assigned_workers || []).includes(employeeEmail)
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-clock-active', employeeEmail] });
    queryClient.invalidateQueries({ queryKey: ['active-time-entry'] });
    queryClient.invalidateQueries({ queryKey: ['today-entries'] });
  };

  const clockInMutation = useMutation({
    mutationFn: async () => {
      const loc = await currentLocation();
      const job = employeeJobs.find(j => j.id === jobId);
      return base44.entities.TimeEntry.create({
        organization_id: user.organization_id,
        employee_email: employee.email,
        employee_name: employee.full_name,
        clock_in: new Date().toISOString(),
        status: 'active',
        job_id: jobId || undefined,
        job_title: job?.title || undefined,
        clock_in_lat: loc?.lat,
        clock_in_lng: loc?.lng,
      });
    },
    onSuccess: () => {
      refresh();
      toast.success(`${employeeName} clocked in`);
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      const loc = await currentLocation();
      const totalHours = Math.max(
        0,
        moment().diff(moment(activeEntry.clock_in), 'hours', true) - (activeEntry.break_minutes || 0) / 60
      );
      return base44.entities.TimeEntry.update(activeEntry.id, {
        clock_out: new Date().toISOString(),
        clock_out_lat: loc?.lat,
        clock_out_lng: loc?.lng,
        status: 'pending_approval',
        total_hours: Math.round(totalHours * 100) / 100,
        is_overtime: totalHours > 8,
      });
    },
    onSuccess: () => {
      refresh();
      toast.success(`${employeeName} clocked out`);
    },
  });

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <UserCog className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Clock in for an employee</h3>
          <p className="text-xs text-muted-foreground">For crew without a phone or signal on site</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Employee</Label>
        <Select
          value={employeeEmail || ' '}
          onValueChange={(v) => {
            setEmployeeEmail(v === ' ' ? '' : v);
            setJobId('');
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose an employee..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Select employee</SelectItem>
            {employees.map(e => (
              <SelectItem key={e.id} value={e.email}>{e.full_name || e.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {employee && (
        <>
          {activeEntry ? (
            <div className="rounded-lg bg-success/5 border border-success/20 p-3 text-sm">
              Clocked in {moment(activeEntry.clock_in).format('h:mm A')}
              {activeEntry.job_title ? ` · ${activeEntry.job_title}` : ''}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Job (optional)</Label>
              <Select value={jobId || ' '} onValueChange={(v) => setJobId(v === ' ' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">No specific job</SelectItem>
                  {employeeJobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>{job.job_number} – {job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {employeeJobs.length === 0 && (
                <p className="text-xs text-muted-foreground">No jobs are currently assigned to this employee.</p>
              )}
            </div>
          )}

          {activeEntry ? (
            <Button
              onClick={() => clockOutMutation.mutate()}
              disabled={clockOutMutation.isPending}
              className="w-full h-12 gap-2 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <LogOut className="h-5 w-5" /> Clock out {employeeName}
            </Button>
          ) : (
            <Button
              onClick={() => clockInMutation.mutate()}
              disabled={clockInMutation.isPending}
              className="w-full h-12 gap-2 rounded-xl bg-success hover:bg-success/90 text-success-foreground"
            >
              <Play className="h-5 w-5" /> Clock in {employeeName}
            </Button>
          )}
        </>
      )}
    </div>
  );
}