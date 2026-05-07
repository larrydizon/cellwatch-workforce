import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import moment from 'moment';

/**
 * Checks the current user's upcoming/active shifts and creates
 * in-app notifications reminding them to clock in or clock out.
 * Runs once when the app loads (per session).
 */

const SESSION_KEY = 'shift_reminders_checked';

export default function useShiftReminders(user) {
  useEffect(() => {
    if (!user?.email) return;
    // Only check once per browser session
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');

    checkAndNotify(user);
  }, [user?.email]);
}

async function checkAndNotify(user) {
  const now = moment();

  // Fetch this user's shifts for today
  const shifts = await base44.entities.Shift.filter(
    { assigned_to: user.email },
    '-start_time',
    20
  );

  const todayShifts = shifts.filter(s =>
    moment(s.start_time).isSame(now, 'day') &&
    !['cancelled', 'completed', 'declined'].includes(s.status)
  );

  if (todayShifts.length === 0) return;

  // Check if already clocked in
  const activeEntries = await base44.entities.TimeEntry.filter(
    { employee_email: user.email, status: 'active' },
    '-created_date',
    1
  );
  const isClockedIn = activeEntries.length > 0;
  const activeEntry = activeEntries[0] || null;

  for (const shift of todayShifts) {
    const startTime = moment(shift.start_time);
    const endTime = moment(shift.end_time);
    const minutesUntilStart = startTime.diff(now, 'minutes');
    const minutesPastEnd = now.diff(endTime, 'minutes');

    // Remind to clock in if shift starts within 15 minutes and not yet clocked in
    if (minutesUntilStart >= -5 && minutesUntilStart <= 15 && !isClockedIn) {
      await createNotificationIfNotExists(user.email, `shift_clockin_${shift.id}`, {
        recipient_email: user.email,
        title: '⏰ Time to Clock In',
        message: `Your shift "${shift.title}" ${minutesUntilStart <= 0 ? 'has started' : `starts in ${minutesUntilStart} min`}. Don't forget to clock in!`,
        type: 'shift_assigned',
        link: '/time-clock',
      });
    }

    // Remind to clock out if shift has ended 15+ min ago and still clocked in
    if (minutesPastEnd >= 15 && isClockedIn && activeEntry) {
      const clockInTime = moment(activeEntry.clock_in);
      // Only remind if the active entry started around this shift
      const minutesDiff = Math.abs(clockInTime.diff(startTime, 'minutes'));
      if (minutesDiff <= 60) {
        await createNotificationIfNotExists(user.email, `shift_clockout_${shift.id}_${now.format('YYYY-MM-DD')}`, {
          recipient_email: user.email,
          title: '🔔 Don\'t Forget to Clock Out',
          message: `Your shift "${shift.title}" ended at ${endTime.format('h:mm A')}. Please clock out now.`,
          type: 'shift_changed',
          link: '/time-clock',
        });
      }
    }
  }
}

async function createNotificationIfNotExists(email, dedupKey, data) {
  // Use dedupKey stored in sessionStorage to avoid duplicate notifications per session
  const storageKey = `notif_sent_${dedupKey}`;
  if (sessionStorage.getItem(storageKey)) return;
  sessionStorage.setItem(storageKey, '1');

  await base44.entities.Notification.create({ ...data, is_read: false });
}