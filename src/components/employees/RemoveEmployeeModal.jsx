import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { runOrganizationCommand } from '@/lib/organizations';

export default function RemoveEmployeeModal({ employee, organizationId, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [confirmation, setConfirmation] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!open || !organizationId) return;
    setConfirmation('');
  }, [open, organizationId]);

  const handleRemove = async () => {
    const email = employee.email?.trim().toLowerCase();
    if (confirmation.trim().toLowerCase() !== email) {
      toast.error('Enter the employee email exactly');
      return;
    }

    setWorking(true);
    try {
      await base44.entities.Employee.delete(employee.directory_id);

      // Clear any invite traces so they don't reappear in the directory
      const org = await base44.entities.Organization.get(organizationId);
      await runOrganizationCommand('update', { changes: {
        member_emails: (org.member_emails || []).filter(e => e?.toLowerCase() !== email),
        pending_invites: (org.pending_invites || []).filter(p => p.email?.toLowerCase() !== email),
      } });

      queryClient.invalidateQueries({ queryKey: ['employees', organizationId] });
      toast.success(`${employee.full_name || employee.email} removed from the team`);
      onOpenChange(false);
    } catch {
      toast.error('Could not remove this employee');
    }
    setWorking(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Remove Employee</DialogTitle>
          <DialogDescription>
            This removes {employee?.full_name || employee?.email} from the team directory.
            Enter the employee email to confirm this action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Employee email</Label>
            <Input
              type="email"
              placeholder={employee?.email || 'employee@example.com'}
              value={confirmation}
              onChange={e => setConfirmation(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={working || confirmation.trim().toLowerCase() !== employee?.email?.trim().toLowerCase()}
          >
            {working ? 'Removing...' : 'Remove Employee'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
