import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import moment from 'moment';

export const MAX_SHIFT_HOURS = 8;

/**
 * Automatically clocks out anyone still clocked in past MAX_SHIFT_HOURS.
 * Their shift is closed at the MAX_SHIFT_HOURS mark (plus any break) and sent
 * for approval, so a forgotten clock-out never becomes an overnight shift.
 */
export default function useAutoClockOut(user) {
  const queryClient = useQueryClient();
  const processed = useRef(new Set());

  const { data: activeEntries = [] } = useQuery({
    queryKey: ['auto-clockout-active', user?.organization_id],
    queryFn: () => base44.entities.TimeEntry.filter({ status: 'active' }, '-created_date', 100),
    enabled: !!user?.organization_id,
    refetchInterval: 5 * 60 * 1000,
  });

  useEffect(() => {
    const overdue = activeEntries.filter((entry) => {
      if (!entry.clock_in || processed.current.has(entry.id)) return false;
      const hours = moment().diff(moment(entry.clock_in), 'hours', true) - (entry.break_minutes || 0) / 60;
      return hours >= MAX_SHIFT_HOURS;
    });
    if (overdue.length === 0) return;

    overdue.forEach((entry) => processed.current.add(entry.id));

    (async () => {
      await Promise.all(overdue.map((entry) => {
        const clockOut = moment(entry.clock_in)
          .add(MAX_SHIFT_HOURS, 'hours')
          .add(entry.break_minutes || 0, 'minutes');
        return base44.entities.TimeEntry.update(entry.id, {
          clock_out: clockOut.toISOString(),
          clock_out_lat: entry.clock_in_lat,
          clock_out_lng: entry.clock_in_lng,
          status: 'pending_approval',
          total_hours: MAX_SHIFT_HOURS,
          is_overtime: false,
          notes: `Auto clocked out after ${MAX_SHIFT_HOURS} hours`,
        });
      }));

      queryClient.invalidateQueries({ queryKey: ['auto-clockout-active'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['active-time-entry'] });
      queryClient.invalidateQueries({ queryKey: ['my-active-entry'] });
    })();
  }, [activeEntries, queryClient]);
}