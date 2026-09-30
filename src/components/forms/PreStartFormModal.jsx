import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitFormResponse } from '@/lib/forms';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClipboardCheck, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import QuestionField from './QuestionField';

export default function PreStartFormModal({ forms, assignments, jobId, open, onOpenChange, onAllCompleted }) {
  const queryClient = useQueryClient();
  const [formIndex, setFormIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completedForms, setCompletedForms] = useState([]);

  const currentForm = forms[formIndex];
  const questions = currentForm?.questions || [];

  const submitMutation = useMutation({
    mutationFn: submitFormResponse,
    onSuccess: () => {
      const nextCompleted = [...completedForms, currentForm.id];
      setCompletedForms(nextCompleted);
      queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['clockin-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });

      if (nextCompleted.length === forms.length) {
        toast.success('All forms completed! Clocking in...');
        onOpenChange(false);
        onAllCompleted();
      } else {
        setFormIndex(i => i + 1);
        setAnswers({});
        toast.success(`"${currentForm.title}" submitted`);
      }
    },
  });

  const handleSubmit = () => {
    // Validate required questions
    for (const q of questions) {
      if (!q.required) continue;
      const ans = answers[q.id];
      const empty = ans === undefined || ans === null || ans === '' || (Array.isArray(ans) && ans.length === 0);
      if (empty) {
        toast.error(`Please answer: "${q.label}"`);
        return;
      }
    }

    const answerList = questions.map(q => ({
      question_id: q.id,
      question_label: q.label,
      answer: answers[q.id] ?? '',
    }));

    const assignment = (assignments || []).find(
      a => a.form_template_id === currentForm.id && ['pending', 'overdue'].includes(a.status)
    );
    submitMutation.mutate({
      form_template_id: currentForm.id,
      assignment_id: assignment?.id,
      answers: answerList,
      job_id: jobId || undefined,
    });
  };

  if (!currentForm) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Required Before Clock-In · {formIndex + 1} of {forms.length}
            </span>
          </div>
          <DialogTitle>{currentForm.title}</DialogTitle>
          {currentForm.description && (
            <p className="text-sm text-muted-foreground mt-1">{currentForm.description}</p>
          )}
        </DialogHeader>

        {/* Progress bar */}
        {forms.length > 1 && (
          <div className="flex gap-1.5">
            {forms.map((f, i) => (
              <div key={f.id} className={`h-1.5 flex-1 rounded-full ${i < completedForms.length ? 'bg-success' : i === formIndex ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="flex-1 gap-2">
            {submitMutation.isPending ? 'Submitting...' : formIndex < forms.length - 1 ? (
              <><span>Next Form</span><ChevronRight className="h-4 w-4" /></>
            ) : (
              <><ClipboardCheck className="h-4 w-4" /><span>Submit & Clock In</span></>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
