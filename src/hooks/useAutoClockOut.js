/**
 * Auto clock-out is deliberately server-only. The scheduled Base44 workflow
 * continues to run when browsers are closed and prevents an employee browser
 * from receiving permission to mutate another worker's time entry.
 */
export default function useAutoClockOut() {}
