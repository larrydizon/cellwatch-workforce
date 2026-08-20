import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ClipboardList, Settings, Eye, Trash2, ToggleLeft, ToggleRight, Send } from 'lucide-react';
import { toast } from 'sonner';
import FormBuilderModal from '@/components/forms/FormBuilderModal';
import FormSubmissionsModal from '@/components/forms/FormSubmissionsModal';
import AssignFormModal from '@/components/forms/AssignFormModal';

const typeLabels = {
  prestart: 'Pre-Start',
  health_safety: 'Health & Safety',
  incident: 'Incident Report',
  hazard: 'Hazard ID',
  induction: 'Induction',
  other: 'Other',
};

const typeColors = {
  prestart: 'bg-blue-50 text-blue-700 border-blue-200',
  health_safety: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  incident: 'bg-red-50 text-red-700 border-red-200',
  hazard: 'bg-amber-50 text-amber-700 border-amber-200',
  induction: 'bg-violet-50 text-violet-700 border-violet-200',
  other: 'bg-slate-50 text-slate-700 border-slate-200',
};

export default function Forms() {
  const { user } = useOutletContext();
  const isAdmin = ['admin', 'operations_manager', 'supervisor'].includes(user?.role);
  const queryClient = useQueryClient();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [viewingSubmissions, setViewingSubmissions] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['form-templates'],
    queryFn: () => base44.entities.FormTemplate.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FormTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      toast.success('Form deleted');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.FormTemplate.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['form-templates'] }),
  });

  const toggleClockInMutation = useMutation({
    mutationFn: ({ id, require_before_clockin }) =>
      base44.entities.FormTemplate.update(id, { require_before_clockin }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['form-templates'] }),
  });

  const handleEdit = (form) => {
    setEditingForm(form);
    setBuilderOpen(true);
  };

  const handleNew = () => {
    setEditingForm(null);
    setBuilderOpen(true);
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>Forms management is for admins only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Forms</h1>
          <p className="text-sm text-muted-foreground mt-1">Build and manage prestart, H&S and other forms</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAssignOpen(true)} variant="outline" className="gap-2">
            <Send className="h-4 w-4" /> Assign Form
          </Button>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" /> New Form
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse h-40" />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border border-border">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No forms yet</p>
          <p className="text-sm mt-1">Create your first form to get started</p>
          <Button onClick={handleNew} className="mt-4 gap-2">
            <Plus className="h-4 w-4" /> New Form
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
            <div key={form.id} className="bg-card rounded-xl border border-border p-5 space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{form.title}</p>
                  {form.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{form.description}</p>
                  )}
                </div>
                <Badge variant="outline" className={typeColors[form.form_type] || typeColors.other}>
                  {typeLabels[form.form_type] || 'Other'}
                </Badge>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {form.questions?.length || 0} questions
                </span>
                <span className="text-muted-foreground">·</span>
                <span className={`text-xs font-medium ${form.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                  {form.is_active ? 'Active' : 'Inactive'}
                </span>
                {form.require_before_clockin && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-xs font-medium text-amber-600">Required at clock-in</span>
                  </>
                )}
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-1 border-t border-border">
                <button
                  onClick={() => toggleActiveMutation.mutate({ id: form.id, is_active: !form.is_active })}
                  className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Form active</span>
                  {form.is_active
                    ? <ToggleRight className="h-5 w-5 text-success" />
                    : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => toggleClockInMutation.mutate({ id: form.id, require_before_clockin: !form.require_before_clockin })}
                  className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Require before clock-in</span>
                  {form.require_before_clockin
                    ? <ToggleRight className="h-5 w-5 text-amber-500" />
                    : <ToggleLeft className="h-5 w-5" />}
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => handleEdit(form)}>
                  <Settings className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => setViewingSubmissions(form)}>
                  <Eye className="h-3.5 w-3.5" /> Responses
                </Button>
                <Button
                  size="sm" variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
                  onClick={() => { if (confirm('Delete this form?')) deleteMutation.mutate(form.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormBuilderModal
        open={builderOpen}
        onOpenChange={(v) => { setBuilderOpen(v); if (!v) setEditingForm(null); }}
        editingForm={editingForm}
      />

      <AssignFormModal open={assignOpen} onOpenChange={setAssignOpen} user={user} />

      {viewingSubmissions && (
        <FormSubmissionsModal
          form={viewingSubmissions}
          open={!!viewingSubmissions}
          onOpenChange={(v) => { if (!v) setViewingSubmissions(null); }}
        />
      )}
    </div>
  );
}