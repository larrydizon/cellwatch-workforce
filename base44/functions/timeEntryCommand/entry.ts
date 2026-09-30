import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { SHIFT_LIMIT_HOURS } from '../../shared/shiftLimits.ts';
import { writeAudit } from '../../shared/audit.ts';

const MANAGER_ROLES = new Set(['admin', 'operations_manager', 'supervisor']);
const MAX_SHIFT_HOURS = 24;
const MAX_BREAK_MINUTES = 12 * 60;

function fail(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

function listItems(value: any): any[] {
  return Array.isArray(value) ? value : value?.items || [];
}

function finiteNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function boundedNumber(value: unknown, min: number, max: number, fallback = 0): number {
  return Math.min(max, Math.max(min, finiteNumber(value, fallback)));
}

function coordinates(body: any, prefix: 'clock_in' | 'clock_out') {
  const lat = Number(body?.[`${prefix}_lat`]);
  const lng = Number(body?.[`${prefix}_lng`]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return {};
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return {};
  return { [`${prefix}_lat`]: lat, [`${prefix}_lng`]: lng };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user: any = await base44.auth.me().catch(() => null);
    if (!user?.email || !user?.organization_id) return fail('Authentication required', 401);

    const body: any = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const isManager = MANAGER_ROLES.has(user.role);
    const svc = base44.asServiceRole;

    const getEntry = async () => {
      if (!body.entry_id) throw new Error('Entry ID is required');
      const entry = await svc.entities.TimeEntry.get(body.entry_id);
      if (!entry || entry.organization_id !== user.organization_id) {
        throw new Error('Time entry not found');
      }
      return entry;
    };

    if (action === 'clock_in' || action === 'admin_clock_in') {
      const actingForAnother = action === 'admin_clock_in';
      if (actingForAnother && !isManager) return fail('Manager access required', 403);

      const employeeEmail = actingForAnother
        ? String(body.employee_email || '').trim().toLowerCase()
        : user.email.toLowerCase();
      const employeeName = actingForAnother
        ? String(body.employee_name || employeeEmail)
        : String(user.full_name || user.email);
      if (!employeeEmail) return fail('Employee is required');

      const existing = listItems(await svc.entities.TimeEntry.filter({
        organization_id: user.organization_id,
        employee_email: employeeEmail,
        status: 'active',
      }, { limit: 1 }));
      if (existing.length) return fail('Employee is already clocked in', 409);

      let job: any = null;
      if (body.job_id) {
        job = await svc.entities.Job.get(body.job_id);
        if (!job || job.organization_id !== user.organization_id) return fail('Job not found', 404);
        if (!isManager && !(job.assigned_workers || []).includes(user.email)) {
          return fail('You are not assigned to this job', 403);
        }
      }

      const entry = await svc.entities.TimeEntry.create({
        organization_id: user.organization_id,
        employee_email: employeeEmail,
        employee_name: employeeName,
        clock_in: new Date().toISOString(),
        status: 'active',
        ...(job ? { job_id: job.id, job_title: job.title } : {}),
        ...coordinates(body, 'clock_in'),
      });
      return Response.json({ entry });
    }

    const entry: any = await getEntry();
    const ownsEntry = entry.employee_email?.toLowerCase() === user.email.toLowerCase();
    const employeeActions = new Set(['clock_out', 'break_toggle', 'overtime_decision']);
    if (employeeActions.has(action) && !ownsEntry && !isManager) return fail('Forbidden', 403);

    if (action === 'clock_out' || action === 'admin_clock_out') {
      if (action === 'admin_clock_out' && !isManager) return fail('Manager access required', 403);
      if (entry.status !== 'active') return fail('Entry is not active', 409);
      const clockOut = new Date();
      const breakMinutes = boundedNumber(entry.break_minutes, 0, MAX_BREAK_MINUTES);
      const elapsed = Math.max(0, (clockOut.getTime() - new Date(entry.clock_in).getTime()) / 3600000 - breakMinutes / 60);
      const totalHours = Math.round(Math.min(MAX_SHIFT_HOURS, elapsed) * 100) / 100;
      const updated = await svc.entities.TimeEntry.update(entry.id, {
        clock_out: clockOut.toISOString(),
        status: 'pending_approval',
        total_hours: totalHours,
        is_overtime: totalHours > SHIFT_LIMIT_HOURS,
        ...coordinates(body, 'clock_out'),
        ...(action === 'admin_clock_out' ? { notes: `Clocked out by ${user.email}` } : {}),
      });
      return Response.json({ entry: updated });
    }

    if (action === 'break_toggle') {
      if (entry.status !== 'active') return fail('Entry is not active', 409);
      if (entry.break_start && !entry.break_end) {
        const minutes = Math.max(0, Math.round((Date.now() - new Date(entry.break_start).getTime()) / 60000));
        const updated = await svc.entities.TimeEntry.update(entry.id, {
          break_end: new Date().toISOString(),
          break_minutes: Math.min(MAX_BREAK_MINUTES, boundedNumber(entry.break_minutes, 0, MAX_BREAK_MINUTES) + minutes),
        });
        return Response.json({ entry: updated });
      }
      const updated = await svc.entities.TimeEntry.update(entry.id, {
        break_start: new Date().toISOString(),
        break_end: null,
      });
      return Response.json({ entry: updated });
    }

    if (action === 'overtime_decision') {
      if (entry.status !== 'active') return fail('Entry is not active', 409);
      const decision = body.decision === 'accepted' ? 'accepted' : 'declined';
      const overtimeHours = decision === 'accepted' ? boundedNumber(body.overtime_hours, 0.5, 12, 0.5) : 0;
      const updated = await svc.entities.TimeEntry.update(entry.id, {
        overtime_decision: decision,
        overtime_hours: overtimeHours,
      });
      return Response.json({ entry: updated });
    }

    if (!isManager) return fail('Manager access required', 403);

    if (action === 'approve' || action === 'reject') {
      if (!['pending_approval', 'rejected', 'adjustment_requested'].includes(entry.status)) {
        return fail('Entry is not awaiting review', 409);
      }
      const status = action === 'approve' ? 'approved' : 'rejected';
      const updated = await svc.entities.TimeEntry.update(entry.id, {
        status,
        approved_by: action === 'approve' ? user.email : null,
      });
      await writeAudit(base44, {
        organization_id: user.organization_id,
        actor_email: user.email,
        actor_name: user.full_name,
        category: 'payroll',
        action: `timesheet_${status}`,
        target: entry.employee_email,
        metadata: { entry_id: entry.id },
      });
      return Response.json({ entry: updated });
    }

    if (action === 'adjust') {
      const totalHours = boundedNumber(body.total_hours, 0, MAX_SHIFT_HOURS);
      const breakMinutes = boundedNumber(body.break_minutes, 0, MAX_BREAK_MINUTES);
      const updated = await svc.entities.TimeEntry.update(entry.id, {
        total_hours: totalHours,
        break_minutes: breakMinutes,
        is_overtime: totalHours > SHIFT_LIMIT_HOURS,
      });
      await writeAudit(base44, {
        organization_id: user.organization_id,
        actor_email: user.email,
        actor_name: user.full_name,
        category: 'payroll',
        action: 'timesheet_adjusted',
        target: entry.employee_email,
        metadata: { entry_id: entry.id, total_hours: totalHours, break_minutes: breakMinutes },
      });
      return Response.json({ entry: updated });
    }

    return fail('Unknown action');
  } catch (error: any) {
    const message = error?.message || 'Request failed';
    const status = /not found/i.test(message) ? 404 : /required/i.test(message) ? 400 : 500;
    return fail(message, status);
  }
}
