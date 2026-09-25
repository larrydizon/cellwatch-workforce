import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import moment from 'moment';
import { SHIFT_LIMIT_HOURS, OVERTIME_PROMPT_MINUTES } from '@/lib/shiftLimits';

/**
 * Returns the signed-in employee's active shift once it is close enough to the
 * 8 hour limit to ask about overtime. Null once they have answered.
 */
export default function useOvertimePrompt(user) {
  const { data: entry = null } = useQuery({
    queryKey: ['overtime-prompt-entry', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const entries = await base44.entities.TimeEntry.filter(
        { employee_email: user.email, status: 'active' },
        '-created_date',
        1
      );
      return entries[0] || null;
    },
    enabled: !!user?.email,
    refetchInterval: 60 * 1000,
  });

  if (!entry?.clock_in) return null;
  if ((entry.overtime_decision || 'pending') !== 'pending') return null;

  const elapsedMinutes = moment().diff(moment(entry.clock_in), 'minutes', true) - (entry.break_minutes || 0);
  return elapsedMinutes >= SHIFT_LIMIT_HOURS * 60 - OVERTIME_PROMPT_MINUTES ? entry : null;
}