import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ProfileFieldForm from './ProfileFieldForm';

export default function ProfileFieldsModal({ open, onOpenChange, organizationId }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['profile-fields', organizationId],
    queryFn: () => base44.entities.ProfileField.filter({ organization_id: organizationId }, 'created_date', 100),
    enabled: !!organizationId && open,
  });

  const closeForm = () => { setShowForm(false); setEditing(null); };

  const saveMutation = useMutation({
    mutationFn: (data) => editing?.id
      ? base44.entities.ProfileField.update(editing.id, data)
      : base44.entities.ProfileField.create({ ...data, organization_id: organizationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-fields', organizationId] });
      toast.success(editing?.id ? 'Field updated' : 'Field added');
      closeForm();
    },
    onError: () => toast.error('Could not save the field'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProfileField.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-fields', organizationId] });
      toast.success('Field removed');
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) closeForm(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Employee Profile Fields</DialogTitle>
          <DialogDescription>
            Add the extra details your company needs — bank account, driver licence, anything else. They appear on every employee's profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {showForm ? (
            <ProfileFieldForm
              field={editing}
              saving={saveMutation.isPending}
              onCancel={closeForm}
              onSave={(data) => saveMutation.mutate(data)}
            />
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => { setEditing(null); setShowForm(true); }}
            >
              <Plus className="h-4 w-4" /> Add Field
            </Button>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No extra fields yet.</p>
          ) : (
            <div className="space-y-2">
              {fields.map(f => (
                <div key={f.id} className="flex items-center gap-3 border border-border rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">{f.field_type}</Badge>
                      {f.admin_only && <Badge variant="outline" className="text-xs">Admin only</Badge>}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(f); setShowForm(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(f.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}