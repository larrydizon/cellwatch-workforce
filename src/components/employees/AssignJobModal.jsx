import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Check, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export default function AssignJobModal({ employee, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState([]);
  const initializedRef = useRef(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 100),
    enabled: open,
  });

  useEffect(() => {
    if (!open) { initializedRef.current = false; return; }
    if (initializedRef.current || !employee || isLoading) return;
    setSelected(jobs.filter(j => j.assigned_workers?.includes(employee.email)).map(j => j.id));
    initializedRef.current = true;
  }, [open, employee, jobs, isLoading]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const original = jobs.filter(j => j.assigned_workers?.includes(employee.email)).map(j => j.id);
      const toAdd = selected.filter(id => !original.includes(id));
      const toRemove = original.filter(id => !selected.includes(id));

      await Promise.all([
        ...toAdd.map(id => {
          const job = jobs.find(j => j.id === id);
          return base44.entities.Job.update(id, {
            assigned_workers: [...(job.assigned_workers || []), employee.email],
          });
        }),
        ...toRemove.map(id => {
          const job = jobs.find(j => j.id === id);
          return base44.entities.Job.update(id, {
            assigned_workers: (job.assigned_workers || []).filter(e => e !== employee.email),
          });
        }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success(`Job assignments updated for ${employee.full_name || employee.email}`);
      onOpenChange(false);
    },
  });

  if (!employee) return null;

  const toggle = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Jobs</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {employee.full_name || employee.email}
          </p>
        </DialogHeader>

        <div className="space-y-1.5 py-2 max-h-80 overflow-y-auto">
          {jobs.map(job => {
            const isAssigned = selected.includes(job.id);
            return (
              <button
                key={job.id}
                type="button"
                onClick={() => toggle(job.id)}
                className={`w-full flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
                  isAssigned ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                  isAssigned ? 'bg-primary border-primary' : 'border-input'
                }`}>
                  {isAssigned && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{job.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">{job.job_number}</p>
                </div>
                <Badge variant="outline" className="shrink-0">{job.status?.replace(/_/g, ' ')}</Badge>
              </button>
            );
          })}
          {!isLoading && jobs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No jobs to assign yet</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save Assignments'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}