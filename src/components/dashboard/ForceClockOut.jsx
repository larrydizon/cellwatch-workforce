import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LogOut, AlertTriangle, Clock } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';

const HOUR_OPTIONS = [4, 6, 7, 8, 9, 10, 12, 14, 16];

export default function ForceClockOut({ timeEntries = [] }) {
  const [maxHours, setMaxHours] = useState('8');
  const queryClient = useQueryClient();

  const active = timeEntries.filter(t => t.status === 'active');

  const forceClockOutMutation = useMutation({
    mutationFn: async (entry) => {
      const clockIn = moment(entry.clock_in);
      const clockOut = moment();
      const breakMins = entry.break_minutes || 0;
      const totalHours = Math.max(0, clockOut.diff(clockIn, 'hours', true) - breakMins / 60);
      return base44.entities.TimeEntry.update(entry.id, {
        clock_out: clockOut.toISOString(),
        clock_out_lat: entry.clock_in_lat,
        clock_out_lng: entry.clock_in_lng,
        status: 'pending_approval',
        total_hours: Math.round(totalHours * 100) / 100,
        is_overtime: totalHours > 8,
        notes: `Force clocked out by admin at ${clockOut.format('h:mm A')}`,
      });
    },
    onSuccess: (_, entry) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['active-time-entry'] });
      toast.success(`${entry.employee_name || entry.employee_email} clocked out`);
    },
  });

  const forceAllMutation = useMutation({
    mutationFn: async (entries) => {
      await Promise.all(entries.map(entry => {
        const clockIn = moment(entry.clock_in);
        const clockOut = moment();
        const breakMins = entry.break_minutes || 0;
        const totalHours = Math.max(0, clockOut.diff(clockIn, 'hours', true) - breakMins / 60);
        return base44.entities.TimeEntry.update(entry.id, {
          clock_out: clockOut.toISOString(),
          status: 'pending_approval',
          total_hours: Math.round(totalHours * 100) / 100,
          is_overtime: totalHours > 8,
          notes: `Force clocked out by admin at ${clockOut.format('h:mm A')}`,
        });
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['active-time-entry'] });
      toast.success('All eligible workers clocked out');
    },
  });

  // Workers who have exceeded maxHours
  const overThreshold = active.filter(t => {
    const hrs = moment().diff(moment(t.clock_in), 'hours', true) - (t.break_minutes || 0) / 60;
    return hrs >= parseFloat(maxHours);
  });

  // All active workers with their elapsed hours
  const withHours = active.map(t => ({
    ...t,
    elapsedHours: Math.max(0, moment().diff(moment(t.clock_in), 'hours', true) - (t.break_minutes || 0) / 60),
  })).sort((a, b) => b.elapsedHours - a.elapsedHours);

  return (
    <div className="space-y-4">
      {/* Threshold selector */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Auto-flag after</span>
          <Select value={maxHours} onValueChange={setMaxHours}>
            <SelectTrigger className="w-28 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOUR_OPTIONS.map(h => (
                <SelectItem key={h} value={String(h)}>{h} hours</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {overThreshold.length > 0 && (
          <Button
            size="sm"
            variant="destructive"
            className="h-8 text-xs gap-1.5"
            disabled={forceAllMutation.isPending}
            onClick={() => forceAllMutation.mutate(overThreshold)}
          >
            <LogOut className="h-3.5 w-3.5" />
            Force out {overThreshold.length} over {maxHours}h
          </Button>
        )}
      </div>

      {/* Worker list */}
      {withHours.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No workers currently clocked in</p>
      ) : (
        <div className="space-y-2">
          {withHours.map(entry => {
            const isOver = entry.elapsedHours >= parseFloat(maxHours);
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isOver
                    ? 'bg-destructive/5 border-destructive/20'
                    : 'bg-accent/40 border-transparent'
                }`}
              >
                <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isOver ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                }`}>
                  {entry.employee_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{entry.employee_name || entry.employee_email}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-xs font-medium ${isOver ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {entry.elapsedHours.toFixed(1)}h
                    </span>
                    {entry.job_title && (
                      <span className="text-xs text-muted-foreground truncate">· {entry.job_title}</span>
                    )}
                  </div>
                </div>
                {isOver && (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1 flex-shrink-0">
                    <AlertTriangle className="h-2.5 w-2.5" /> Over {maxHours}h
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant={isOver ? 'destructive' : 'outline'}
                  className="h-8 text-xs gap-1.5 flex-shrink-0"
                  disabled={forceClockOutMutation.isPending}
                  onClick={() => forceClockOutMutation.mutate(entry)}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Clock Out
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}