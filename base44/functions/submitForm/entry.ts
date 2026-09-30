import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

function fail(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

function listItems(value: any): any[] {
  return Array.isArray(value) ? value : value?.items || [];
}

function answerIsEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === '' ||
    (Array.isArray(value) && value.length === 0);
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user: any = await base44.auth.me().catch(() => null);
    if (!user?.email || !user?.organization_id) return fail('Authentication required', 401);

    const body: any = await req.json().catch(() => ({}));
    if (!body.form_template_id) return fail('Form template is required');

    const svc = base44.asServiceRole;
    const form: any = await svc.entities.FormTemplate.get(body.form_template_id);
    if (!form || form.organization_id !== user.organization_id || form.is_active === false) {
      return fail('Form not found', 404);
    }

    const suppliedAnswers = Array.isArray(body.answers) ? body.answers : [];
    const suppliedById = new Map(
      suppliedAnswers.map((answer: any) => [String(answer?.question_id || ''), answer?.answer]),
    );
    const questions = Array.isArray(form.questions) ? form.questions : [];
    for (const question of questions) {
      if (question?.required && answerIsEmpty(suppliedById.get(String(question.id)))) {
        return fail(`Required question is unanswered: ${question.label || question.id}`);
      }
    }

    const answers = questions.map((question: any) => ({
      question_id: String(question.id || ''),
      question_label: String(question.label || ''),
      answer: suppliedById.get(String(question.id)) ?? '',
    }));
    if (JSON.stringify(answers).length > 100_000) return fail('Form response is too large', 413);

    let assignment: any = null;
    if (body.assignment_id) {
      assignment = await svc.entities.FormAssignment.get(body.assignment_id);
      if (!assignment || assignment.organization_id !== user.organization_id) {
        return fail('Assignment not found', 404);
      }
      if (assignment.employee_email?.toLowerCase() !== user.email.toLowerCase() ||
          assignment.form_template_id !== form.id) {
        return fail('Assignment does not belong to this employee and form', 403);
      }
      if (assignment.status !== 'pending' && assignment.status !== 'overdue') {
        return fail('Assignment is already completed', 409);
      }
    }

    let job: any = null;
    if (body.job_id) {
      job = await svc.entities.Job.get(body.job_id);
      if (!job || job.organization_id !== user.organization_id) return fail('Job not found', 404);
      const assignedWorkers = Array.isArray(job.assigned_workers) ? job.assigned_workers : [];
      if (!assignedWorkers.map((email: any) => String(email).toLowerCase()).includes(user.email.toLowerCase())) {
        return fail('You are not assigned to this job', 403);
      }
    }

    const employeeRecords = listItems(await svc.entities.Employee.filter({
      organization_id: user.organization_id,
      email: user.email.toLowerCase(),
    }, { limit: 1 }));
    const employeeName = employeeRecords[0]?.full_name || user.full_name || user.email;
    const submission = await svc.entities.FormSubmission.create({
      organization_id: user.organization_id,
      form_template_id: form.id,
      form_title: form.title,
      employee_email: user.email.toLowerCase(),
      employee_name: employeeName,
      answers,
      submitted_at: new Date().toISOString(),
      ...(job ? { job_id: job.id, job_title: job.title } : {}),
    });

    if (assignment) {
      await svc.entities.FormAssignment.update(assignment.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        form_submission_id: submission.id,
      });
    }

    return Response.json({ submission });
  } catch (error: any) {
    return fail(error?.message || 'Request failed', 500);
  }
}
