import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import UserLevelForm from './UserLevelForm';

export default function UserLevelsModal({ open, onOpenChange, organizationId }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data: levels = [], isLoading } = useQuery({
    queryKey: ['user-levels', organizationId],
    queryFn: () => base44.entities.UserLevel.filter({ organization_id: organizationId }, 'created_date', 100),
    enabled: !!organizationId && open,
  });

  const closeForm = () => { setShowForm(false); setEditing(null); };

  const saveMutation = useMutation({
    mutationFn: (data) => editing?.id
      ? base44.entities.UserLevel.update(editing.id, data)
      : base44.entities.UserLevel.create({ ...data, organization_id: organizationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-levels', organizationId] });
      toast.success(editing?.id ? 'Level updated' : 'Level added');
      closeForm();
    },
    onError: () => toast.error('Could not save the level'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UserLevel.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-levels', organizationId] });
      toast.success('Level removed');
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) closeForm(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Levels</DialogTitle>
          <DialogDescription>
            The levels you can assign to employees — add your own, like Office Manager, Office Worker or Standard User.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {showForm ? (
            <UserLevelForm
              level={editing}
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
              <Plus className="h-4 w-4" /> Add Level
            </Button>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : levels.length === 0 ? (
            <p className="text-sm text-muted-foreground">No levels yet.</p>
          ) : (
            <div className="space-y-2">
              {levels.map(l => (
                <div key={l.id} className="flex items-center gap-3 border border-border rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{l.label}</p>
                    {l.is_admin && (
                      <Badge variant="outline" className="text-xs mt-1">Administrator access</Badge>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(l); setShowForm(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(l.id)}>
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