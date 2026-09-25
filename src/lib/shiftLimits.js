// Shared shift-limit rules used by the auto clock-out sweep and the overtime reminder.
export const SHIFT_LIMIT_HOURS = 8;

// How long before the shift limit the employee is asked about overtime
export const OVERTIME_PROMPT_MINUTES = 30;

// A shift ends at the standard limit plus any overtime the employee agreed to
export function shiftLimitHours(entry) {
  return SHIFT_LIMIT_HOURS + (entry?.overtime_hours || 0);
}