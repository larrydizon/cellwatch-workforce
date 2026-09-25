import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MapPin, Users, Clock, Briefcase, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';

export default function JobDetailModal({ job, open, onOpenChange, canAssign }) {
  const { user } = useOutletContext();
  const queryClient = useQueryClient();
  const [assigned, setAssigned] = useState([]);

  // Read the team directory so employees who have been added but not signed in yet are listed too
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', user?.organization_id],
    queryFn: () => base44.entities.Employee.filter({ organization_id: user.organization_id }, 'full_name', 200),
    enabled: !!user?.organization_id && canAssign,
  });

  useEffect(() => {
    if (open && job) setAssigned(job.assigned_workers || []);
  }, [open, job]);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.Job.update(job.id, { assigned_workers: assigned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job assignments updated');
      onOpenChange(false);
    },
  });

  if (!job) return null;

  const toggle = (email) => setAssigned(prev =>
    prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{job.job_number}</span>
            <Badge variant="outline">{job.status?.replace(/_/g, ' ')}</Badge>
          </div>
          <DialogTitle>{job.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {job.client_name && (
              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{job.client_name}</span>
            )}
            {job.site_address && (
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.site_address}</span>
            )}
            {job.estimated_hours && (
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.estimated_hours}h est.</span>
            )}
          </div>
          {job.scope_of_work && <p className="text-sm text-muted-foreground">{job.scope_of_work}</p>}
        </div>

        {canAssign && (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Assign Employees</p>
              <span className="text-xs text-muted-foreground ml-auto">{assigned.length} assigned</span>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {employees.map(emp => {
                const isAssigned = assigned.includes(emp.email);
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => toggle(emp.email)}
                    className={`w-full flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
                      isAssigned ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                      isAssigned ? 'bg-primary border-primary' : 'border-input'
                    }`}>
                      {isAssigned && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{emp.full_name || emp.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                    </div>
                  </button>
                );
              })}
              {employees.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No employees found</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          {canAssign && (
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Assignments'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}