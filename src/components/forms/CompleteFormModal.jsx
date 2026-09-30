import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitFormResponse } from '@/lib/forms';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import QuestionField from './QuestionField';

export default function CompleteFormModal({ form, assignment, open, onOpenChange, onCompleted }) {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState({});
  const questions = form?.questions || [];

  const submitMutation = useMutation({
    mutationFn: submitFormResponse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['form-assignments'] });
      toast.success('Form submitted');
      setAnswers({});
      onOpenChange(false);
      onCompleted?.();
    },
  });

  const handleSubmit = () => {
    for (const q of questions) {
      if (!q.required) continue;
      const ans = answers[q.id];
      const empty = ans === undefined || ans === null || ans === '' || (Array.isArray(ans) && ans.length === 0);
      if (empty) { toast.error(`Please answer: "${q.label}"`); return; }
    }
    const answerList = questions.map(q => ({ question_id: q.id, question_label: q.label, answer: answers[q.id] ?? '' }));
    submitMutation.mutate({
      form_template_id: form.id,
      assignment_id: assignment?.id,
      answers: answerList,
    });
  };

  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {assignment ? 'Assigned Form' : 'Form'}
            </span>
          </div>
          <DialogTitle>{form.title}</DialogTitle>
          {form.description && <p className="text-sm text-muted-foreground mt-1">{form.description}</p>}
        </DialogHeader>

        {assignment?.due_date && (
          <p className="text-xs text-warning font-medium">
            Due {moment(assignment.due_date).format('D MMM YYYY')}
          </p>
        )}

        <div className="space-y-6 py-2">
          {questions.map((q, i) => (
            <div key={q.id} className="space-y-2">
              <label className="text-sm font-medium">
                {i + 1}. {q.label}
                {q.required && <span className="text-destructive ml-1">*</span>}
              </label>
              <QuestionField
                question={q}
                value={answers[q.id]}
                onChange={(val) => setAnswers(a => ({ ...a, [q.id]: val }))}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="flex-1 gap-2">
            {submitMutation.isPending ? 'Submitting...' : <><ClipboardCheck className="h-4 w-4" /> Submit Form</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
