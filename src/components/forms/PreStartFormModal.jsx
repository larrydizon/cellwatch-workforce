import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

function QuestionField({ question, value, onChange }) {
  const { type, label, required, options = [] } = question;

  if (type === 'yes_no') {
    return (
      <div className="flex gap-3">
        {['Yes', 'No'].map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
              value === opt
                ? opt === 'Yes'
                  ? 'border-success bg-success/10 text-success'
                  : 'border-destructive bg-destructive/10 text-destructive'
                : 'border-border hover:border-primary/40'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (type === 'checkbox') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={e => {
                const next = e.target.checked ? [...selected, opt] : selected.filter(x => x !== opt);
                onChange(next);
              }}
              className="rounded"
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  if (type === 'select') {
    return (
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Select an option..." /></SelectTrigger>
        <SelectContent>
          {options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  if (type === 'textarea') {
    return <Textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Your answer..." className="h-24" />;
  }

  if (type === 'number') {
    return <Input type="number" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Enter a number" />;
  }

  if (type === 'signature') {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">By typing your name below, you acknowledge the above statement.</p>
        <Input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Type your full name to sign" />
      </div>
    );
  }

  // Default: text
  return <Input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Your answer..." />;
}

export default function PreStartFormModal({ forms, user, jobId, jobTitle, open, onOpenChange, onAllCompleted }) {
  const queryClient = useQueryClient();
  const [formIndex, setFormIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completedForms, setCompletedForms] = useState([]);

  const currentForm = forms[formIndex];
  const questions = currentForm?.questions || [];

  const submitMutation = useMutation({
    mutationFn: (data) => base44.entities.FormSubmission.create(data),
    onSuccess: () => {
      const nextCompleted = [...completedForms, currentForm.id];
      setCompletedForms(nextCompleted);
      queryClient.invalidateQueries({ queryKey: ['form-submissions'] });

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

    submitMutation.mutate({
      form_template_id: currentForm.id,
      form_title: currentForm.title,
      employee_email: user.email,
      employee_name: user.full_name,
      answers: answerList,
      submitted_at: new Date().toISOString(),
      job_id: jobId || undefined,
      job_title: jobTitle || undefined,
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