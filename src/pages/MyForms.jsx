import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, CheckCircle2, Award, Calendar, ChevronRight, Plus } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import CompleteFormModal from '@/components/forms/CompleteFormModal';
import ManageTrainingModal from '@/components/forms/ManageTrainingModal';

const typeLabels = {
  prestart: 'Pre-Start', health_safety: 'Health & Safety', incident: 'Incident',
  hazard: 'Hazard ID', induction: 'Induction', other: 'Other',
};
const trainingTypeLabels = { certificate: 'Certificate', training: 'Training', induction: 'Induction', ticket: 'Ticket / Licence' };

export default function MyForms() {
  const { user } = useOutletContext();
  const isAdmin = ['admin', 'operations_manager', 'supervisor'].includes(user?.role);
  const [tab, setTab] = useState('assigned');
  const [completing, setCompleting] = useState(null);
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);

  const { data: myAssignments = [] } = useQuery({
    queryKey: ['my-assignments', user?.email],
    queryFn: () => base44.entities.FormAssignment.filter({ employee_email: user.email }, '-assigned_at', 100),
    enabled: !!user?.email,
  });

  const { data: allForms = [] } = useQuery({
    queryKey: ['form-templates'],
    queryFn: () => base44.entities.FormTemplate.filter({ is_active: true }, 'title', 200),
  });

  const { data: mySubmissions = [] } = useQuery({
    queryKey: ['my-submissions', user?.email],
    queryFn: () => base44.entities.FormSubmission.filter({ employee_email: user.email }, '-submitted_at', 100),
    enabled: !!user?.email,
  });

  const { data: myTrainings = [] } = useQuery({
    queryKey: ['my-trainings', user?.email],
    queryFn: () => base44.entities.Training.filter({ employee_email: user.email }, '-created_date', 100),
    enabled: !!user?.email,
  });

  const pendingAssignments = myAssignments.filter(a => a.status === 'pending');
  const completedAssignments = myAssignments.filter(a => a.status === 'completed');

  const handleComplete = (assignment) => {
    const form = allForms.find(f => f.id === assignment.form_template_id);
    if (!form) { toast.error('Form template not found'); return; }
    setCompleting({ assignment, form });
  };

  const tabs = [
    { key: 'assigned', label: 'Assigned to Me', icon: ClipboardList, count: pendingAssignments.length },
    { key: 'completed', label: 'Completed Forms', icon: CheckCircle2, count: mySubmissions.length },
    { key: 'training', label: 'Certificates & Training', icon: Award, count: myTrainings.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Forms</h1>
        <p className="text-muted-foreground text-sm mt-1">Forms assigned to you, your completed forms, and certificates & training</p>
      </div>

      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-full sm:w-auto sm:inline-flex">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all flex-1 sm:flex-none justify-center ${
              tab === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(' ')[0]}</span>
            {t.count > 0 && (
              <span className={`text-xs px-1.5 rounded-full ${tab === t.key ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'assigned' && (
        <div className="space-y-3">
          {pendingAssignments.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No pending forms" subtitle="You're all caught up" />
          ) : (
            pendingAssignments.map(a => {
              const isOverdue = a.due_date && moment(a.due_date).isBefore(moment(), 'day');
              const isDueToday = a.due_date && moment(a.due_date).isSame(moment(), 'day');
              return (
                <div key={a.id} className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${isOverdue ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                    <ClipboardList className={`h-5 w-5 ${isOverdue ? 'text-destructive' : 'text-primary'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{a.form_title}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <Badge variant="outline" className="text-xs">{typeLabels[a.form_type] || 'Form'}</Badge>
                      {a.due_date && (
                        <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : isDueToday ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                          <Calendar className="h-3 w-3" />
                          {isOverdue ? 'Overdue · ' : isDueToday ? 'Due today · ' : 'Due '}
                          {moment(a.due_date).format('D MMM YYYY')}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">Assigned {moment(a.assigned_at || a.created_date).format('D MMM')}</span>
                    </div>
                  </div>
                  <Button onClick={() => handleComplete(a)} className="gap-2">
                    Complete <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          )}
          {completedAssignments.length > 0 && (
            <div className="pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Completed Assignments</p>
              {completedAssignments.map(a => (
                <div key={a.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{a.form_title}</p>
                    <p className="text-xs text-muted-foreground">Completed {moment(a.completed_at).format('D MMM YYYY')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'completed' && (
        <div className="space-y-3">
          {mySubmissions.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="No completed forms yet" subtitle="Your submitted forms will appear here" />
          ) : (
            mySubmissions.map(s => (
              <div key={s.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{s.form_title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submitted {moment(s.submitted_at || s.created_date).format('D MMM YYYY, h:mm A')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">{typeLabels[s.form_type] || 'Form'}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'training' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Your certificates, tickets, and training records</p>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setEditingTraining(null); setTrainingModalOpen(true); }}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          {myTrainings.length === 0 ? (
            <EmptyState icon={Award} title="No records yet" subtitle="Add a certificate or training to keep track" />
          ) : (
            myTrainings.map(t => {
              const isExpired = t.expiry_date && moment(t.expiry_date).isBefore(moment(), 'day');
              const expiringSoon = t.expiry_date && !isExpired && moment(t.expiry_date).isBefore(moment().add(30, 'days'), 'day');
              return (
                <div key={t.id} className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{t.title}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <Badge variant="outline" className="text-xs">{trainingTypeLabels[t.type] || t.type}</Badge>
                        {t.issuer && <span className="text-xs text-muted-foreground">{t.issuer}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {t.issue_date && <span>Issued {moment(t.issue_date).format('D MMM YYYY')}</span>}
                        {t.expiry_date && (
                          <span className={isExpired ? 'text-destructive font-medium' : expiringSoon ? 'text-warning font-medium' : ''}>
                            {isExpired ? 'Expired ' : 'Expires '}{moment(t.expiry_date).format('D MMM YYYY')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <Button size="sm" variant="ghost" onClick={() => { setEditingTraining(t); setTrainingModalOpen(true); }}>Edit</Button>
                      )}
                      {t.file_url && <a href={t.file_url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline">View</Button></a>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {completing && (
        <CompleteFormModal
          form={completing.form}
          assignment={completing.assignment}
          user={user}
          open={!!completing}
          onOpenChange={(v) => { if (!v) setCompleting(null); }}
        />
      )}

      <ManageTrainingModal
        open={trainingModalOpen}
        onOpenChange={(v) => { setTrainingModalOpen(v); if (!v) setEditingTraining(null); }}
        user={user}
        editingTraining={editingTraining}
      />
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
      <Icon className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="font-medium">{title}</p>
      <p className="text-sm mt-1">{subtitle}</p>
    </div>
  );
}