import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ClipboardCheck, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const newEntry = () => ({ job_id: ' ', job_title: '', work_done: '' });

export default function DailyReportModal({
  open,
  onOpenChange,
  employee = null,
  employees = [],
  organizationId,
  filedBy,
  allowDateChange = false,
  defaultJob = null,
  note,
  onSubmitted,
}) {
  const queryClient = useQueryClient();
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [reportDate, setReportDate] = useState(moment().format('YYYY-MM-DD'));
  const [entries, setEntries] = useState([newEntry()]);

  const selectedEmail = employee?.email || employeeEmail;
  const selectedName = employee?.full_name
    || employees.find(e => e.email === selectedEmail)?.full_name
    || selectedEmail;

  useEffect(() => {
    if (!open) return;
    setEmployeeEmail(employee?.email || '');
    setReportDate(moment().format('YYYY-MM-DD'));
    setEntries([{ ...newEntry(), job_id: defaultJob?.id || ' ', job_title: defaultJob?.title || '' }]);
  }, [open, employee?.email, defaultJob?.id]);

  const { data: assignedJobs = [] } = useQuery({
    queryKey: ['daily-report-jobs', selectedEmail],
    queryFn: () => base44.entities.Job.filter({ assigned_workers: selectedEmail }, '-created_date', 100),
    enabled: open && !!selectedEmail,
  });

  // Keep the shift's own job selectable even if it is not on the employee's list
  const jobOptions = defaultJob && !assignedJobs.some(j => j.id === defaultJob.id)
    ? [defaultJob, ...assignedJobs]
    : assignedJobs;

  const setEntry = (index, patch) =>
    setEntries(list => list.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  const submitMutation = useMutation({
    mutationFn: (data) => base44.entities.DailyReport.create(data),
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ['daily-reports'] });
      queryClient.invalidateQueries({ queryKey: ['today-daily-report'] });
      toast.success('Daily report submitted');
      onOpenChange(false);
      onSubmitted?.(report);
    },
  });

  const handleSubmit = () => {
    if (!selectedEmail) {
      toast.error('Choose an employee for this report');
      return;
    }
    const filled = entries.filter(e => e.work_done.trim());
    if (filled.length === 0) {
      toast.error('Add what was done for at least one job');
      return;
    }
    if (filled.some(e => e.job_id === 'other' && !e.job_title.trim())) {
      toast.error('Name the job on every "Other" line');
      return;
    }

    submitMutation.mutate({
      organization_id: organizationId,
      employee_email: selectedEmail,
      employee_name: selectedName,
      report_date: reportDate,
      entries: filled.map(e => ({
        job_id: e.job_id && e.job_id !== 'other' && e.job_id !== ' ' ? e.job_id : undefined,
        job_title: e.job_id === 'other'
          ? e.job_title.trim()
          : (jobOptions.find(j => j.id === e.job_id)?.title || ''),
        work_done: e.work_done.trim(),
      })),
      submitted_at: new Date().toISOString(),
      submitted_by: filedBy || selectedEmail,
      filed_by_admin: (filedBy || '') !== selectedEmail,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Daily Report
            </span>
          </div>
          <DialogTitle>What was done today</DialogTitle>
          <DialogDescription>
            {note || 'List each job and the work completed on it.'}
          </DialogDescription>
        </DialogHeader>

        {!employee && employees.length > 0 && (
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={employeeEmail || ' '} onValueChange={(v) => setEmployeeEmail(v === ' ' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Choose an employee..." /></SelectTrigger>
              <SelectContent>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.email}>{e.full_name || e.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {allowDateChange && (
          <div className="space-y-2">
            <Label>Report date</Label>
            <Input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-48"
            />
          </div>
        )}

        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div key={index} className="rounded-lg border border-border p-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-2">
                  <Label>Job</Label>
                  <Select
                    value={entry.job_id || ' '}
                    onValueChange={(v) => setEntry(index, { job_id: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Choose a job..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">No specific job</SelectItem>
                      {jobOptions.map(job => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.job_number ? `${job.job_number} – ${job.title}` : job.title}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other (type below)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {entries.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 mt-6 text-muted-foreground hover:text-destructive"
                    onClick={() => setEntries(list => list.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {entry.job_id === 'other' && (
                <Input
                  placeholder="Job or task name"
                  value={entry.job_title}
                  onChange={(e) => setEntry(index, { job_title: e.target.value })}
                />
              )}

              <div className="space-y-2">
                <Label>Work done</Label>
                <Textarea
                  className="h-20"
                  placeholder="What was completed on this job?"
                  value={entry.work_done}
                  onChange={(e) => setEntry(index, { work_done: e.target.value })}
                />
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setEntries(list => [...list, newEntry()])}
          >
            <Plus className="h-4 w-4" /> Add another job
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            {submitMutation.isPending ? 'Submitting...' : 'Submit report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}