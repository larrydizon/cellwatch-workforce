import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClipboardList, CheckCircle2, Award, Calendar } from 'lucide-react';
import moment from 'moment';

const typeLabels = {
  prestart: 'Pre-Start', health_safety: 'Health & Safety', incident: 'Incident',
  hazard: 'Hazard ID', induction: 'Induction', other: 'Other',
};
const trainingTypeLabels = { certificate: 'Certificate', training: 'Training', induction: 'Induction', ticket: 'Ticket / Licence' };

export default function EmployeeFormsModal({ employee, open, onOpenChange }) {
  const [tab, setTab] = useState('assigned');

  const { data: assignments = [] } = useQuery({
    queryKey: ['employee-assignments', employee?.email],
    queryFn: () => base44.entities.FormAssignment.filter({ employee_email: employee.email }, '-assigned_at', 100),
    enabled: !!employee?.email && open,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['employee-submissions', employee?.email],
    queryFn: () => base44.entities.FormSubmission.filter({ employee_email: employee.email }, '-submitted_at', 100),
    enabled: !!employee?.email && open,
  });

  const { data: trainings = [] } = useQuery({
    queryKey: ['employee-trainings', employee?.email],
    queryFn: () => base44.entities.Training.filter({ employee_email: employee.email }, '-created_date', 100),
    enabled: !!employee?.email && open,
  });

  const pending = assignments.filter(a => a.status === 'pending');
  const completed = assignments.filter(a => a.status === 'completed');

  const tabs = [
    { key: 'assigned', label: 'Assigned', icon: ClipboardList, count: pending.length },
    { key: 'completed', label: 'Completed Forms', icon: CheckCircle2, count: submissions.length },
    { key: 'training', label: 'Certificates & Training', icon: Award, count: trainings.length },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee?.full_name || employee?.email} — Forms View</DialogTitle>
          <p className="text-sm text-muted-foreground">{employee?.email}</p>
        </DialogHeader>

        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex-1 justify-center ${
                tab === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
              {t.count > 0 && (
                <span className={`text-[10px] px-1 rounded-full ${tab === t.key ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'assigned' && (
          <div className="space-y-2">
            {pending.length === 0 && completed.length === 0 ? (
              <Empty text="No forms assigned" />
            ) : (
              <>
                {pending.map(a => {
                  const isOverdue = a.due_date && moment(a.due_date).isBefore(moment(), 'day');
                  return (
                    <div key={a.id} className="border border-border rounded-lg p-3 flex items-center gap-3">
                      <ClipboardList className={`h-4 w-4 flex-shrink-0 ${isOverdue ? 'text-destructive' : 'text-primary'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.form_title}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{typeLabels[a.form_type] || 'Form'}</Badge>
                          {a.due_date && (
                            <span className={`text-[11px] flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                              <Calendar className="h-3 w-3" />
                              {isOverdue ? 'Overdue · ' : 'Due '}{moment(a.due_date).format('D MMM')}
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground">By {a.assigned_by?.split('@')[0]}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {completed.map(a => (
                  <div key={a.id} className="border border-border rounded-lg p-3 flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.form_title}</p>
                      <p className="text-[11px] text-muted-foreground">Completed {a.completed_at ? moment(a.completed_at).format('D MMM YYYY') : ''}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {tab === 'completed' && (
          <div className="space-y-2">
            {submissions.length === 0 ? (
              <Empty text="No completed forms" />
            ) : (
              submissions.map(s => (
                <div key={s.id} className="border border-border rounded-lg p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.form_title}</p>
                    <p className="text-[11px] text-muted-foreground">{moment(s.submitted_at || s.created_date).format('D MMM YYYY, h:mm A')}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{typeLabels[s.form_type] || 'Form'}</Badge>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'training' && (
          <div className="space-y-2">
            {trainings.length === 0 ? (
              <Empty text="No certificates or training" />
            ) : (
              trainings.map(t => {
                const isExpired = t.expiry_date && moment(t.expiry_date).isBefore(moment(), 'day');
                return (
                  <div key={t.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <Badge variant="outline" className="text-[10px]">{trainingTypeLabels[t.type] || t.type}</Badge>
                          {t.issuer && <span className="text-[11px] text-muted-foreground">{t.issuer}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                          {t.issue_date && <span>Issued {moment(t.issue_date).format('D MMM YYYY')}</span>}
                          {t.expiry_date && (
                            <span className={isExpired ? 'text-destructive font-medium' : ''}>
                              {isExpired ? 'Expired ' : 'Expires '}{moment(t.expiry_date).format('D MMM YYYY')}
                            </span>
                          )}
                        </div>
                      </div>
                      {t.file_url && <a href={t.file_url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline">View</Button></a>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Empty({ text }) {
  return <p className="text-center text-sm text-muted-foreground py-8">{text}</p>;
}