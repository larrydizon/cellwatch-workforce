import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Coffee, LogOut, Play, AlertTriangle } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import LocationMapLink from '@/components/timeclock/LocationMapLink';
import PreStartFormModal from '@/components/forms/PreStartFormModal';
import AdminClockPanel from '@/components/timeclock/AdminClockPanel';
import DailyReportModal from '@/components/reports/DailyReportModal';
import { runTimeEntryCommand } from '@/lib/timeEntries';
import useOrganization from '@/hooks/useOrganization';
import { useLocationConsent } from '@/lib/LocationConsentContext';

const TRACKING_INTERVAL_KEY = 'location_tracking_interval_ms';

function getTrackingInterval() {
  const val = localStorage.getItem(TRACKING_INTERVAL_KEY);
  return val ? parseInt(val, 10) : 0; // 0 = disabled
}

export default function TimeClock() {
  const { user } = useOutletContext();
  const { consentGiven } = useLocationConsent();
  const orgState = useOrganization(user);
  // Nothing location-related runs without one-time consent, and never when the
  // workspace has switched GPS capture off.
  const trackLocation = consentGiven && orgState.settings.capture_gps;
  const [currentTime, setCurrentTime] = useState(moment());
  const [selectedJob, setSelectedJob] = useState('');
  const [location, setLocation] = useState(null);
  const [showPreStartForms, setShowPreStartForms] = useState(false);
  const [showDailyReport, setShowDailyReport] = useState(false);
  const queryClient = useQueryClient();
  const trackingRef = useRef(null);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(moment()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get initial location once — the browser permission is only ever requested
  // after the employee has consented.
  useEffect(() => {
    if (!trackLocation || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, [trackLocation]);

  // Live location tracking interval (from Settings preference)
  useEffect(() => {
    const interval = getTrackingInterval();
    if (!trackLocation || !interval || !navigator.geolocation) return;

    trackingRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }, interval);

    return () => clearInterval(trackingRef.current);
  }, [trackLocation]);

  const { data: activeEntry } = useQuery({
    queryKey: ['active-time-entry', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const entries = await base44.entities.TimeEntry.filter({ employee_email: user.email, status: 'active' }, '-created_date', 1);
      return entries[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: allJobs = [] } = useQuery({
    queryKey: ['timeclock-jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 100),
  });

  // Load active forms (used to resolve both general pre-start forms and assigned forms)
  const { data: allForms = [] } = useQuery({
    queryKey: ['clockin-required-forms'],
    queryFn: () => base44.entities.FormTemplate.filter({ is_active: true }, 'title', 100),
    enabled: !activeEntry,
  });

  // Forms assigned directly to this employee that are still pending
  const { data: myAssignments = [] } = useQuery({
    queryKey: ['clockin-assignments', user?.email],
    queryFn: () => base44.entities.FormAssignment.filter({ employee_email: user.email, status: 'pending' }, '-assigned_at', 100),
    enabled: !!user?.email && !activeEntry,
  });

  const isAdmin = user?.role === 'admin';

  // Only jobs assigned to the signed-in employee can be selected for clock-in
  const jobs = allJobs.filter(j =>
    !['completed', 'cancelled', 'invoiced'].includes(j.status) &&
    (j.assigned_workers || []).includes(user?.email)
  );

  const prestartForms = allForms.filter(f => f.require_before_clockin);

  // Only forms assigned directly to this employee block clock-in. Induction and
  // training forms are tasks to complete, not clock-in gates.
  const requiredForms = myAssignments
    .filter(a => a.status === 'pending')
    .map(a => prestartForms.find(f => f.id === a.form_template_id))
    .filter(f => f && f.form_type !== 'induction');

  const { data: todayEntries = [] } = useQuery({
    queryKey: ['today-entries', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const entries = await base44.entities.TimeEntry.filter({ employee_email: user.email }, '-created_date', 20);
      return entries.filter(e => moment(e.clock_in).isSame(moment(), 'day'));
    },
    enabled: !!user?.email,
  });

  // Daily report requirement set by an administrator for this employee
  const { data: myDirectoryRecord } = useQuery({
    queryKey: ['my-employee-record', user?.email],
    queryFn: async () => {
      const records = await base44.entities.Employee.filter(
        { organization_id: user.organization_id, email: user.email },
        '-created_date',
        1
      );
      return records[0] || null;
    },
    enabled: !!user?.email && !!user?.organization_id,
  });

  const { data: todayReport } = useQuery({
    queryKey: ['today-daily-report', user?.email],
    queryFn: async () => {
      const reports = await base44.entities.DailyReport.filter(
        { employee_email: user.email, report_date: moment().format('YYYY-MM-DD') },
        '-created_date',
        1
      );
      return reports[0] || null;
    },
    enabled: !!user?.email,
  });

  const needsDailyReport = !!myDirectoryRecord?.daily_report_required && !todayReport;

  const clockInMutation = useMutation({
    mutationFn: async () => {
      const job = jobs.find(j => j.id === selectedJob);
      return runTimeEntryCommand('clock_in', {
        job_id: selectedJob || undefined,
        job_title: job?.title || undefined,
        clock_in_lat: location?.lat,
        clock_in_lng: location?.lng,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-time-entry'] });
      queryClient.invalidateQueries({ queryKey: ['today-entries'] });
      toast.success('Clocked in successfully');
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () =>
      runTimeEntryCommand('clock_out', {
        entry_id: activeEntry.id,
        clock_out_lat: location?.lat,
        clock_out_lng: location?.lng,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-time-entry'] });
      queryClient.invalidateQueries({ queryKey: ['today-entries'] });
      toast.success('Clocked out successfully');
    },
  });

  const breakMutation = useMutation({
    mutationFn: () => runTimeEntryCommand('break_toggle', { entry_id: activeEntry.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-time-entry'] });
      toast.success(activeEntry?.break_start && !activeEntry?.break_end ? 'Break ended' : 'Break started');
    },
  });

  const handleClockInClick = () => {
    if (requiredForms.length > 0) {
      // Employees must be onsite (location captured) to complete the pre-start check.
      // With tracking off there is no location to check against, so clock-in still works.
      if (trackLocation && !location) {
        toast.error('You must be onsite to complete the pre-start check. Enable location access and try again.');
        return;
      }
      setShowPreStartForms(true);
    } else {
      clockInMutation.mutate();
    }
  };

  // Finish clock-in once every required form has been submitted
  const completePreStartCheck = () => {
    if (trackLocation && !location) {
      toast.error('You must be onsite to complete the pre-start check. Enable location access and try again.');
      return;
    }
    clockInMutation.mutate();
  };

  // A required daily report is captured before the shift is closed
  const handleClockOutClick = () => {
    if (needsDailyReport) {
      setShowDailyReport(true);
      return;
    }
    clockOutMutation.mutate();
  };

  const isOnBreak = activeEntry?.break_start && !activeEntry?.break_end;
  const elapsed = activeEntry ? moment.duration(currentTime.diff(moment(activeEntry.clock_in))) : null;
  const todayTotal = todayEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Clock Display */}
      <div className="bg-card rounded-2xl border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
          {currentTime.format('dddd, D MMMM')}
        </p>
        <p className="text-5xl md:text-6xl font-bold tracking-tight mt-2 font-mono">
          {currentTime.format('HH:mm')}
        </p>
        <p className="text-lg text-muted-foreground font-mono mt-1">{currentTime.format(':ss')}</p>

        {location && (
          <div className="mt-4 flex justify-center">
            <LocationMapLink lat={location.lat} lng={location.lng} label="Current location" />
          </div>
        )}
      </div>

      {/* Active Session */}
      {activeEntry && (
        <div className="bg-success/5 border border-success/20 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-success">Currently Clocked In</span>
          </div>
          {activeEntry.job_title && (
            <p className="text-sm text-muted-foreground">Job: {activeEntry.job_title}</p>
          )}
          <p className="text-2xl font-bold font-mono">
            {String(Math.floor(elapsed?.asHours() || 0)).padStart(2, '0')}:
            {String(elapsed?.minutes() || 0).padStart(2, '0')}:
            {String(elapsed?.seconds() || 0).padStart(2, '0')}
          </p>
          {isOnBreak && (
            <p className="text-sm text-amber-600 font-medium">On break</p>
          )}
          {/* Clock-in location */}
          {activeEntry.clock_in_lat && (
            <div className="pt-2 border-t border-success/20">
              <LocationMapLink lat={activeEntry.clock_in_lat} lng={activeEntry.clock_in_lng} label="Clocked in at" />
            </div>
          )}
        </div>
      )}

      {/* Job Selection (when not clocked in) */}
      {!activeEntry && (
        <div className="space-y-2">
          <Label>Select Job (optional)</Label>
          <Select value={selectedJob} onValueChange={setSelectedJob}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a job..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">No specific job</SelectItem>
              {jobs.map(job => (
                <SelectItem key={job.id} value={job.id}>
                  {job.job_number} – {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {jobs.length === 0 && (
            <p className="text-xs text-muted-foreground">No jobs are currently assigned to you.</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {!activeEntry ? (
          <div className="space-y-2">
            <Button
              onClick={handleClockInClick}
              disabled={clockInMutation.isPending}
              className="w-full h-16 text-lg font-semibold rounded-xl gap-3 bg-success hover:bg-success/90 text-success-foreground"
            >
              <Play className="h-6 w-6" /> Clock In
            </Button>
            {requiredForms.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPreStartForms(true)}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {requiredForms.length} form{requiredForms.length > 1 ? 's' : ''} need completing before clock-in — tap to open
              </button>
            )}
            {requiredForms.length > 0 && trackLocation && !location && (
              <p className="text-center text-xs text-muted-foreground">
                You must be onsite with location enabled to clock in.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => breakMutation.mutate()}
              disabled={breakMutation.isPending}
              variant="outline"
              className="h-14 gap-2 rounded-xl"
            >
              <Coffee className="h-5 w-5" />
              {isOnBreak ? 'End Break' : 'Start Break'}
            </Button>
            <Button
              onClick={handleClockOutClick}
              disabled={clockOutMutation.isPending}
              className="h-14 gap-2 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <LogOut className="h-5 w-5" /> Clock Out
            </Button>
          </div>
        )}
        {activeEntry && needsDailyReport && (
          <p className="text-center text-xs text-muted-foreground">
            A daily report of today's work is required before you clock out.
          </p>
        )}
      </div>

      {/* Today's Summary */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-sm mb-3">Today's Summary</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Hours</p>
            <p className="text-lg font-bold">{todayTotal.toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Entries</p>
            <p className="text-lg font-bold">{todayEntries.length}</p>
          </div>
        </div>
        {todayEntries.length > 0 && (
          <div className="space-y-4">
            {todayEntries.map(e => (
              <div key={e.id} className="border-t border-border pt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {moment(e.clock_in).format('h:mm A')} – {e.clock_out ? moment(e.clock_out).format('h:mm A') : 'Active'}
                  </span>
                  <span className="font-medium">{e.total_hours ? `${e.total_hours}h` : '—'}</span>
                </div>
                {/* Clock-in map link */}
                {e.clock_in_lat && (
                  <LocationMapLink lat={e.clock_in_lat} lng={e.clock_in_lng} label="Clock in" />
                )}
                {/* Clock-out map link */}
                {e.clock_out_lat && (
                  <LocationMapLink lat={e.clock_out_lat} lng={e.clock_out_lng} label="Clock out" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {isAdmin && <AdminClockPanel user={user} />}

      {showPreStartForms && requiredForms.length > 0 && (
        <PreStartFormModal
          forms={requiredForms}
          user={user}
          assignments={myAssignments}
          jobId={selectedJob || undefined}
          jobTitle={jobs.find(j => j.id === selectedJob)?.title}
          open={showPreStartForms}
          onOpenChange={setShowPreStartForms}
          onAllCompleted={completePreStartCheck}
        />
      )}

      {showDailyReport && (
        <DailyReportModal
          open={showDailyReport}
          onOpenChange={setShowDailyReport}
          employee={{ email: user.email, full_name: user.full_name }}
          organizationId={user.organization_id}
          filedBy={user.email}
          note="Required before you clock out — list each job and the work completed."
          defaultJob={activeEntry?.job_id ? { id: activeEntry.job_id, title: activeEntry.job_title } : null}
          onSubmitted={() => {
            setShowDailyReport(false);
            clockOutMutation.mutate();
          }}
        />
      )}
    </div>
  );
}