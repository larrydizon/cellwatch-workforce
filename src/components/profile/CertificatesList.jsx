import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Plus, Pencil } from 'lucide-react';
import moment from 'moment';
import ManageTrainingModal from '@/components/forms/ManageTrainingModal';
import ProfileSection from './ProfileSection';

const typeLabels = {
  certificate: 'Certificate',
  training: 'Training',
  induction: 'Induction',
  ticket: 'Ticket / Licence',
};

export default function CertificatesList({ user }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: trainings = [] } = useQuery({
    queryKey: ['my-trainings', user?.email],
    queryFn: () => base44.entities.Training.filter({ employee_email: user.email }, '-created_date', 100),
    enabled: !!user?.email,
  });

  return (
    <ProfileSection
      title="Certificates & Training"
      action={
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      }
    >
      {trainings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No certificates or training added yet.</p>
      ) : (
        <div className="space-y-2">
          {trainings.map(t => (
            <div key={t.id} className="flex items-center gap-3 border border-border rounded-lg p-3">
              <Award className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">{typeLabels[t.type] || t.type}</Badge>
                  {t.issuer && <span className="text-xs text-muted-foreground">{t.issuer}</span>}
                  {t.expiry_date && (
                    <span className="text-xs text-muted-foreground">
                      Expires {moment(t.expiry_date).format('D MMM YYYY')}
                    </span>
                  )}
                </div>
              </div>
              {t.file_url && (
                <a href={t.file_url} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="ghost">View</Button>
                </a>
              )}
              <Button size="sm" variant="ghost" onClick={() => { setEditing(t); setOpen(true); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <ManageTrainingModal
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}
        user={user}
        editingTraining={editing}
      />
    </ProfileSection>
  );
}