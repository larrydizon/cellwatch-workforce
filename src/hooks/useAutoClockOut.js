import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import moment from 'moment';
import { shiftLimitHours, SHIFT_LIMIT_HOURS } from '@/lib/shiftLimits';

/**
 * Automatically clocks out anyone still clocked in past their shift limit —
 * the standard 8 hours, plus any overtime the employee agreed to. The shift is
 * closed at the limit and sent to the admin for approval.
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
      return hours >= shiftLimitHours(entry);
    });
    if (overdue.length === 0) return;

    overdue.forEach((entry) => processed.current.add(entry.id));

    (async () => {
      await Promise.all(overdue.map((entry) => {
        const limit = shiftLimitHours(entry);
        const clockOut = moment(entry.clock_in)
          .add(limit, 'hours')
          .add(entry.break_minutes || 0, 'minutes');
        return base44.entities.TimeEntry.update(entry.id, {
          clock_out: clockOut.toISOString(),
          clock_out_lat: entry.clock_in_lat,
          clock_out_lng: entry.clock_in_lng,
          status: 'pending_approval',
          total_hours: limit,
          is_overtime: limit > SHIFT_LIMIT_HOURS,
          notes: `Auto clocked out after ${limit} hours`,
        });
      }));

      queryClient.invalidateQueries({ queryKey: ['auto-clockout-active'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['active-time-entry'] });
      queryClient.invalidateQueries({ queryKey: ['my-active-entry'] });
    })();
  }, [activeEntries, queryClient]);
}