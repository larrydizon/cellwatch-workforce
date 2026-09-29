import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { shiftLimitHours, elapsedHours, scheduledClockOut, SHIFT_LIMIT_HOURS } from '../../shared/shiftLimits.ts';
import { writeAudit } from '../../shared/audit.ts';

// Closes any shift left open past its limit, even when the employee's browser is
// closed. Runs from the scheduled workflow; also safe to trigger by an admin.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Scheduled runs arrive without a user; an authenticated caller must be an admin.
    let user: any = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const now = new Date();
    const closed: any[] = [];

    let cursor: string | undefined = undefined;
    do {
      const page = await svc.entities.TimeEntry.filter({ status: 'active' }, { limit: 200, cursor });
      for (const entry of page.items || []) {
        if (!entry.clock_in) continue;
        const limit = shiftLimitHours(entry);
        if (elapsedHours(entry, now) < limit) continue;

        const clockOut = scheduledClockOut(entry);
        await svc.entities.TimeEntry.update(entry.id, {
          clock_out: clockOut.toISOString(),
          clock_out_lat: entry.clock_in_lat,
          clock_out_lng: entry.clock_in_lng,
          status: 'pending_approval',
          total_hours: limit,
          is_overtime: limit > SHIFT_LIMIT_HOURS,
          notes: `Auto clocked out after ${limit} hours`,
        });

        closed.push(entry);

        await writeAudit(base44, {
          organization_id: entry.organization_id,
          category: 'system',
          action: 'shift_auto_closed',
          detail: `Shift auto-closed after ${limit} hours`,
          target: entry.employee_email,
          metadata: { entry_id: entry.id, limit_hours: limit },
        });

        if (entry.employee_email) {
          try {
            await svc.entities.Notification.create({
              organization_id: entry.organization_id,
              recipient_email: entry.employee_email,
              title: 'Shift auto-closed',
              message: `You were automatically clocked out after ${limit} hours. Your timesheet is awaiting approval.`,
              type: 'general',
              link: '/time-clock',
            });
          } catch { /* notification is best-effort */ }
        }
      }
      cursor = page.has_more ? page.next_cursor : undefined;
    } while (cursor);

    return Response.json({ closed: closed.length, checked_at: now.toISOString() });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}