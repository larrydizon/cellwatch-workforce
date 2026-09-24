import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Clock, MapPin, Coffee, LogOut, Play, AlertTriangle } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import LocationMapLink from '@/components/timeclock/LocationMapLink';
import PreStartFormModal from '@/components/forms/PreStartFormModal';
import AdminClockPanel from '@/components/timeclock/AdminClockPanel';
import { POSITIONS } from '@/components/forms/IndustryTemplates';

const TRACKING_INTERVAL_KEY = 'location_tracking_interval_ms';
const WORKER_POSITION_KEY = 'worker_position';

function getTrackingInterval() {
  const val = localStorage.getItem(TRACKING_INTERVAL_KEY);
  return val ? parseInt(val, 10) : 0; // 0 = disabled
}

export default function TimeClock() {
  const { user } = useOutletContext();
  const [currentTime, setCurrentTime] = useState(moment());
  const [selectedJob, setSelectedJob] = useState('');
  const [location, setLocation] = useState(null);
  const [showPreStartForms, setShowPreStartForms] = useState(false);
  const [position, setPosition] = useState(() => localStorage.getItem(WORKER_POSITION_KEY) || '');
  const queryClient = useQueryClient();
  const trackingRef = useRef(null);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(moment()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get initial location once
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  // Live location tracking interval (from Settings preference)
  useEffect(() => {
    const interval = getTrackingInterval();
    if (!interval || !navigator.geolocation) return;

    trackingRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }, interval);

    return () => clearInterval(trackingRef.current);
  }, []);

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

  // Check if user already submitted these forms today/this week
  const { data: todaySubmissions = [] } = useQuery({
    queryKey: ['my-form-submissions-today', user?.email],
    queryFn: () => base44.entities.FormSubmission.filter({ employee_email: user.email }, '-submitted_at', 50),
    enabled: !!user?.email && !activeEntry,
  });

  const isAdmin = user?.role === 'admin';

  // Only jobs assigned to the signed-in employee can be selected for clock-in
  const jobs = allJobs.filter(j =>
    !['completed', 'cancelled', 'invoiced'].includes(j.status) &&
    (j.assigned_workers || []).includes(user?.email)
  );

  const activeJob = jobs.find(j => j.id === selectedJob);
  const selectedJobType = activeJob?.job_type || '';

  const prestartForms = allForms.filter(f => f.require_before_clockin);

  // Forms assigned directly to this employee and marked required before clock-in are
  // mandatory for clock-in, regardless of position or job category
  const assignedRequiredForms = myAssignments
    .filter(a => a.status === 'pending')
    .map(a => prestartForms.find(f => f.id === a.form_template_id))
    .filter(Boolean);

  // Admins are not required to complete pre-start forms
  const generalRequiredForms = isAdmin ? [] : prestartForms.filter(form => {
    // Filter by worker's position: universal forms (no industry) show to everyone;
    // industry-specific forms only show to workers with matching position
    if (form.industry && form.industry !== position) return false;

    // Job-category gating: forms tagged to specific job categories are only required
    // when the employee has selected a job of one of those categories
    if (form.job_types?.length) {
      if (!activeJob || !form.job_types.includes(selectedJobType)) return false;
    }

    const submitted = todaySubmissions.filter(s => s.form_template_id === form.id);
    if (submitted.length === 0) return true;
    if (form.frequency === 'every_clockin') return true;
    if (form.frequency === 'daily') {
      return !submitted.some(s => moment(s.submitted_at || s.created_date).isSame(moment(), 'day'));
    }
    if (form.frequency === 'weekly') {
      return !submitted.some(s => moment(s.submitted_at || s.created_date).isSame(moment(), 'week'));
    }
    return false;
  });

  // Forms assigned directly to an employee are mandatory for everyone, including admins
  const requiredForms = [
    ...generalRequiredForms,
    ...assignedRequiredForms.filter(f => !generalRequiredForms.some(g => g.id === f.id)),
  ];

  const { data: todayEntries = [] } = useQuery({
    queryKey: ['today-entries', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const entries = await base44.entities.TimeEntry.filter({ employee_email: user.email }, '-created_date', 20);
      return entries.filter(e => moment(e.clock_in).isSame(moment(), 'day'));
    },
    enabled: !!user?.email,
  });

  const clockInMutation = useMutation({
    mutationFn: async () => {
      const job = jobs.find(j => j.id === selectedJob);
      return base44.entities.TimeEntry.create({
        organization_id: user.organization_id,
        employee_email: user.email,
        employee_name: user.full_name,
        clock_in: new Date().toISOString(),
        status: 'active',
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
    mutationFn: async () => {
      const clockIn = moment(activeEntry.clock_in);
      const clockOut = moment();
      const breakMins = activeEntry.break_minutes || 0;
      const totalHours = Math.max(0, clockOut.diff(clockIn, 'hours', true) - breakMins / 60);

      return base44.entities.TimeEntry.update(activeEntry.id, {
        clock_out: new Date().toISOString(),
        clock_out_lat: location?.lat,
        clock_out_lng: location?.lng,
        status: 'pending_approval',
        total_hours: Math.round(totalHours * 100) / 100,
        is_overtime: totalHours > 8,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-time-entry'] });
      queryClient.invalidateQueries({ queryKey: ['today-entries'] });
      toast.success('Clocked out successfully');
    },
  });

  const breakMutation = useMutation({
    mutationFn: async () => {
      if (activeEntry.break_start && !activeEntry.break_end) {
        const breakDuration = moment().diff(moment(activeEntry.break_start), 'minutes');
        return base44.entities.TimeEntry.update(activeEntry.id, {
          break_end: new Date().toISOString(),
          break_minutes: (activeEntry.break_minutes || 0) + breakDuration,
        });
      } else {
        return base44.entities.TimeEntry.update(activeEntry.id, {
          break_start: new Date().toISOString(),
          break_end: null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-time-entry'] });
      toast.success(activeEntry?.break_start && !activeEntry?.break_end ? 'Break ended' : 'Break started');
    },
  });

  const handleClockInClick = () => {
    if (requiredForms.length > 0) {
      // Employees must be onsite (location captured) to complete the pre-start check
      if (!location) {
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
    if (!location) {
      toast.error('You must be onsite to complete the pre-start check. Enable location access and try again.');
      return;
    }
    clockInMutation.mutate();
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

      {/* Position Selection (when not clocked in) */}
      {!activeEntry && (
        <div className="space-y-2">
          <Label>Your Position</Label>
          <Select
            value={position || ' '}
            onValueChange={(v) => {
              const val = v === ' ' ? '' : v;
              setPosition(val);
              localStorage.setItem(WORKER_POSITION_KEY, val);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your position..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">Not specified</SelectItem>
              {POSITIONS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {prestartForms.length > 0 && !position && (
            <p className="text-xs text-muted-foreground">Select your position to see your industry-specific pre-start form.</p>
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
          {prestartForms.some(f => f.job_types?.length) && !activeJob && (
            <p className="text-xs text-muted-foreground">
              Select the job you're working on to see any job-specific pre-start forms.
            </p>
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
            {requiredForms.length > 0 && !location && (
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
              onClick={() => clockOutMutation.mutate()}
              disabled={clockOutMutation.isPending}
              className="h-14 gap-2 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <LogOut className="h-5 w-5" /> Clock Out
            </Button>
          </div>
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
    </div>
  );
}