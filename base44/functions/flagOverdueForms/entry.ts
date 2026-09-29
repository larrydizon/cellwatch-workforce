import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { writeAudit } from '../../shared/audit.ts';

// Flags form assignments past their due date and tells the people involved, so
// overdue work surfaces without anyone opening the app.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    let user: any = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const today = new Date().toISOString().slice(0, 10);
    const flagged: any[] = [];

    const orgs = await svc.entities.Organization.list({ limit: 200 });
    for (const org of orgs.items || orgs || []) {
      const settings = org.settings || {};
      const emailOn = settings.email_notifications !== false;

      const page = await svc.entities.FormAssignment.filter(
        { organization_id: org.id, status: 'pending', due_date: { $lt: today } },
        { limit: 200 }
      );

      for (const assignment of page.items || []) {
        await svc.entities.FormAssignment.update(assignment.id, { status: 'overdue' });
        flagged.push(assignment);

        await writeAudit(base44, {
          organization_id: org.id,
          category: 'system',
          action: 'form_marked_overdue',
          detail: `${assignment.form_title || 'Form'} overdue`,
          target: assignment.employee_email,
          metadata: { assignment_id: assignment.id, due_date: assignment.due_date },
        });

        if (assignment.employee_email) {
          try {
            await svc.entities.Notification.create({
              organization_id: org.id,
              recipient_email: assignment.employee_email,
              title: 'Form overdue',
              message: `${assignment.form_title || 'A form'} was due on ${assignment.due_date}. Please complete it.`,
              type: 'task_assigned',
              link: '/my-forms',
            });
          } catch { /* best-effort */ }

          if (emailOn) {
            try {
              await svc.integrations.Core.SendEmail({
                to: assignment.employee_email,
                subject: `Overdue form: ${assignment.form_title || 'Form'}`,
                body: `Hi ${assignment.employee_name || 'there'},\n\nYour form "${assignment.form_title || 'Form'}" was due on ${assignment.due_date} and is now overdue. Please complete it as soon as possible.\n\n— Cellwatch Workforce`,
              });
            } catch { /* email is best-effort */ }
          }
        }
      }
    }

    return Response.json({ flagged: flagged.length, checked_at: new Date().toISOString() });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}