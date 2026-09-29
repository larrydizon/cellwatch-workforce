// Shared shift-limit rules. Mirrors src/lib/shiftLimits.js so the scheduled
// sweep and the in-app reminder always agree on when a shift should end.

export const SHIFT_LIMIT_HOURS = 8;
export const OVERTIME_PROMPT_MINUTES = 30;

// A shift ends at the standard limit plus any overtime the employee agreed to.
export function shiftLimitHours(entry: any): number {
  return SHIFT_LIMIT_HOURS + (entry?.overtime_hours || 0);
}

// Hours actually elapsed on an open entry, excluding logged breaks.
export function elapsedHours(entry: any, now: Date = new Date()): number {
  if (!entry?.clock_in) return 0;
  const ms = now.getTime() - new Date(entry.clock_in).getTime();
  return ms / 3600000 - (entry.break_minutes || 0) / 60;
}

// The instant an entry should have been closed at, given its limit.
export function scheduledClockOut(entry: any): Date {
  const limit = shiftLimitHours(entry);
  const base = new Date(entry.clock_in).getTime();
  return new Date(base + limit * 3600000 + (entry.break_minutes || 0) * 60000);
}