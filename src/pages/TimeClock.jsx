import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Clock, MapPin, Coffee, LogOut, Play } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';

export default function TimeClock() {
  const { user } = useOutletContext();
  const [currentTime, setCurrentTime] = useState(moment());
  const [selectedJob, setSelectedJob] = useState('');
  const [location, setLocation] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(moment()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
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

  const { data: jobs = [] } = useQuery({
    queryKey: ['active-jobs'],
    queryFn: () => base44.entities.Job.filter({ status: 'in_progress' }, '-created_date', 50),
  });

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
          <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
          </div>
        )}
      </div>

      {/* Active Session */}
      {activeEntry && (
        <div className="bg-success/5 border border-success/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-success">Currently Clocked In</span>
          </div>
          {activeEntry.job_title && (
            <p className="text-sm text-muted-foreground mb-1">Job: {activeEntry.job_title}</p>
          )}
          <p className="text-2xl font-bold font-mono">
            {String(Math.floor(elapsed?.asHours() || 0)).padStart(2, '0')}:
            {String(elapsed?.minutes() || 0).padStart(2, '0')}:
            {String(elapsed?.seconds() || 0).padStart(2, '0')}
          </p>
          {isOnBreak && (
            <p className="text-sm text-amber-600 font-medium mt-1">On break</p>
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
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {!activeEntry ? (
          <Button
            onClick={() => clockInMutation.mutate()}
            disabled={clockInMutation.isPending}
            className="w-full h-16 text-lg font-semibold rounded-xl gap-3 bg-success hover:bg-success/90 text-success-foreground"
          >
            <Play className="h-6 w-6" /> Clock In
          </Button>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Today's Summary */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-sm mb-3">Today's Summary</h3>
        <div className="grid grid-cols-2 gap-4">
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
          <div className="mt-4 space-y-2">
            {todayEntries.map(e => (
              <div key={e.id} className="flex items-center justify-between text-sm py-1.5 border-t border-border">
                <span className="text-muted-foreground">
                  {moment(e.clock_in).format('h:mm A')} – {e.clock_out ? moment(e.clock_out).format('h:mm A') : 'Active'}
                </span>
                <span className="font-medium">{e.total_hours ? `${e.total_hours}h` : '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}