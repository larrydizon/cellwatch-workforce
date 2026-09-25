import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function RemoveEmployeeModal({ employee, organizationId, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [savedPin, setSavedPin] = useState(null);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!open || !organizationId) return;
    setPin('');
    setConfirmPin('');
    setLoading(true);
    base44.entities.Organization.get(organizationId)
      .then(org => setSavedPin(org?.employee_delete_pin || null))
      .finally(() => setLoading(false));
  }, [open, organizationId]);

  const needsSetup = !savedPin;

  const handleRemove = async () => {
    const code = pin.trim();
    if (!/^\d{4}$/.test(code)) {
      toast.error('Enter a 4-digit code');
      return;
    }
    if (needsSetup && code !== confirmPin.trim()) {
      toast.error('The two codes do not match');
      return;
    }
    if (!needsSetup && code !== savedPin) {
      toast.error('Incorrect admin code');
      return;
    }

    setWorking(true);
    try {
      if (needsSetup) {
        await base44.entities.Organization.update(organizationId, { employee_delete_pin: code });
      }

      await base44.entities.Employee.delete(employee.directory_id);

      // Clear any invite traces so they don't reappear in the directory
      const org = await base44.entities.Organization.get(organizationId);
      const email = employee.email?.toLowerCase();
      await base44.entities.Organization.update(organizationId, {
        member_emails: (org.member_emails || []).filter(e => e?.toLowerCase() !== email),
        pending_invites: (org.pending_invites || []).filter(p => p.email?.toLowerCase() !== email),
      });

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
            {needsSetup
              ? ' Create a 4-digit admin code first — only share it with administrators.'
              : ' Enter the 4-digit admin code to confirm.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{needsSetup ? 'Create Admin Code' : 'Admin Code'}</Label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </div>
          {needsSetup && (
            <div className="space-y-2">
              <Label>Confirm Admin Code</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={working || loading || pin.length !== 4}
          >
            {working ? 'Removing...' : 'Remove Employee'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}