import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { INDUSTRIES, INDUSTRY_TEMPLATES } from './IndustryTemplates';

const QUESTION_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'checkbox', label: 'Multiple Choice (checkboxes)' },
  { value: 'select', label: 'Dropdown Select' },
  { value: 'number', label: 'Number' },
  { value: 'signature', label: 'Signature (acknowledgement)' },
];

function newQuestion() {
  return { id: Date.now().toString(), label: '', type: 'yes_no', required: true, options: [] };
}

function seedQuestions(templateQuestions) {
  return templateQuestions.map(q => ({
    ...q,
    id: Date.now().toString() + Math.random(),
  }));
}

export default function FormBuilderModal({ open, onOpenChange, editingForm }) {
  const queryClient = useQueryClient();

  // Step: 'industry' (only for new forms) | 'builder'
  const [step, setStep] = useState('industry');
  const [selectedIndustry, setSelectedIndustry] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formType, setFormType] = useState('prestart');
  const [frequency, setFrequency] = useState('daily');
  const [questions, setQuestions] = useState([newQuestion()]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      if (editingForm) {
        setStep('builder');
        setTitle(editingForm.title || '');
        setDescription(editingForm.description || '');
        setFormType(editingForm.form_type || 'prestart');
        setFrequency(editingForm.frequency || 'daily');
        setQuestions(editingForm.questions?.length ? editingForm.questions : [newQuestion()]);
      } else {
        setStep('industry');
        setSelectedIndustry('');
        setTitle('');
        setDescription('');
        setFormType('prestart');
        setFrequency('daily');
        setQuestions([newQuestion()]);
      }
    }
  }, [open, editingForm]);

  const handleIndustryContinue = () => {
    if (!selectedIndustry) { toast.error('Please select an industry'); return; }
    const template = INDUSTRY_TEMPLATES[selectedIndustry];
    if (template) {
      setFormType(template.formType || 'prestart');
      setDescription(template.description || '');
      setQuestions(template.questions.length ? seedQuestions(template.questions) : [newQuestion()]);
    }
    setStep('builder');
  };

  const saveMutation = useMutation({
    mutationFn: (data) => editingForm
      ? base44.entities.FormTemplate.update(editingForm.id, data)
      : base44.entities.FormTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      toast.success(editingForm ? 'Form updated' : 'Form created');
      onOpenChange(false);
    },
  });

  const handleSave = () => {
    if (!title.trim()) { toast.error('Please enter a form title'); return; }
    saveMutation.mutate({ title, description, form_type: formType, frequency, questions, is_active: true });
  };

  const addQuestion = () => setQuestions(q => [...q, newQuestion()]);
  const removeQuestion = (id) => setQuestions(q => q.filter(x => x.id !== id));
  const updateQuestion = (id, patch) => setQuestions(q => q.map(x => x.id === id ? { ...x, ...patch } : x));
  const moveQuestion = (index, dir) => {
    const newQ = [...questions];
    const target = index + dir;
    if (target < 0 || target >= newQ.length) return;
    [newQ[index], newQ[target]] = [newQ[target], newQ[index]];
    setQuestions(newQ);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingForm ? 'Edit Form' : step === 'industry' ? 'Choose Industry Template' : 'New Form'}
          </DialogTitle>
        </DialogHeader>

        {/* ── STEP 1: Industry Picker ── */}
        {step === 'industry' && (
          <div className="space-y-5 py-2">
            <p className="text-sm text-muted-foreground">
              Select your industry to get a pre-built form tailored to your compliance needs, or start from scratch.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INDUSTRIES.map(ind => (
                <button
                  key={ind.value}
                  onClick={() => setSelectedIndustry(ind.value)}
                  className={`text-left rounded-xl border p-4 text-sm font-medium transition-all ${
                    selectedIndustry === ind.value
                      ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                      : 'border-border hover:border-primary/40 hover:bg-muted/50'
                  }`}
                >
                  {ind.label}
                </button>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleIndustryContinue} className="gap-2">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── STEP 2: Form Builder ── */}
        {step === 'builder' && (
          <>
            <div className="space-y-5 py-2">
              {/* Industry badge if not editing */}
              {!editingForm && selectedIndustry && (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                    {INDUSTRIES.find(i => i.value === selectedIndustry)?.label} template
                  </span>
                  <button
                    onClick={() => setStep('industry')}
                    className="text-xs text-muted-foreground underline hover:text-foreground"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Form Meta */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Form Title *</Label>
                  <Input placeholder="e.g. Daily Prestart Check" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Form Type</Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prestart">Pre-Start</SelectItem>
                      <SelectItem value="health_safety">Health & Safety</SelectItem>
                      <SelectItem value="incident">Incident Report</SelectItem>
                      <SelectItem value="hazard">Hazard ID</SelectItem>
                      <SelectItem value="induction">Induction</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Brief instructions for employees..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="h-20"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Completion Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="every_clockin">Every Clock-In</SelectItem>
                    <SelectItem value="daily">Once Per Day</SelectItem>
                    <SelectItem value="weekly">Once Per Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Questions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Questions ({questions.length})</Label>
                  <Button size="sm" variant="outline" onClick={addQuestion} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add Question
                  </Button>
                </div>

                {questions.map((q, index) => (
                  <div key={q.id} className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-1 mt-1">
                        <button onClick={() => moveQuestion(index, -1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => moveQuestion(index, 1)} disabled={index === questions.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder={`Question ${index + 1}`}
                          value={q.label}
                          onChange={e => updateQuestion(q.id, { label: e.target.value })}
                        />
                        <div className="flex items-center gap-2 flex-wrap">
                          <Select value={q.type} onValueChange={v => updateQuestion(q.id, { type: v })}>
                            <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {QUESTION_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={e => updateQuestion(q.id, { required: e.target.checked })}
                              className="rounded"
                            />
                            Required
                          </label>
                        </div>
                        {['checkbox', 'select'].includes(q.type) && (
                          <div className="space-y-1.5">
                            <p className="text-xs text-muted-foreground">Options (one per line)</p>
                            <Textarea
                              className="h-20 text-xs"
                              placeholder="Option 1&#10;Option 2&#10;Option 3"
                              value={(q.options || []).join('\n')}
                              onChange={e => updateQuestion(q.id, { options: e.target.value.split('\n').filter(Boolean) })}
                            />
                          </div>
                        )}
                      </div>
                      <button onClick={() => removeQuestion(q.id)} className="text-muted-foreground hover:text-destructive transition-colors mt-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : editingForm ? 'Save Changes' : 'Create Form'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}