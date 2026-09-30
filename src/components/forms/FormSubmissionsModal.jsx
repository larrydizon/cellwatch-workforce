import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import moment from 'moment';
import { ClipboardCheck } from 'lucide-react';

export default function FormSubmissionsModal({ form, open, onOpenChange }) {
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['form-submissions', form?.id],
    queryFn: () => base44.entities.FormSubmission.filter({ form_template_id: form.id }, '-submitted_at', 100),
    enabled: !!form?.id && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Responses — {form?.title}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground text-sm">Loading...</div>
        ) : submissions.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No submissions yet</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {submissions.map((sub) => (
              <div key={sub.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-medium text-sm">{sub.employee_name || sub.employee_email}</p>
                    {sub.job_title && <p className="text-xs text-muted-foreground">Job: {sub.job_title}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {moment(sub.submitted_at || sub.created_date).format('D MMM YYYY, h:mm A')}
                  </span>
                </div>
                <div className="space-y-2">
                  {(sub.answers || []).map((ans, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className="text-muted-foreground flex-shrink-0 w-48 truncate">{ans.question_label}</span>
                      <span className="font-medium">
                        {Array.isArray(ans.answer) ? ans.answer.join(', ') : String(ans.answer ?? '—')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
