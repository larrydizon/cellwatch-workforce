import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import moment from 'moment';
import { SHIFT_LIMIT_HOURS } from '@/lib/shiftLimits';

export default function AdjustTimeEntryModal({ entry, open, onOpenChange }) {
  const [hours, setHours] = useState('');
  const [breakMins, setBreakMins] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open && entry) {
      setHours(entry.total_hours ?? '');
      setBreakMins(entry.break_minutes ?? 0);
    }
  }, [open, entry]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const totalHours = parseFloat(hours) || 0;
      return base44.entities.TimeEntry.update(entry.id, {
        total_hours: totalHours,
        break_minutes: parseFloat(breakMins) || 0,
        is_overtime: totalHours > SHIFT_LIMIT_HOURS,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-time-entries'] });
      toast.success('Timesheet adjusted');
      onOpenChange(false);
    },
  });

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust timesheet</DialogTitle>
          <DialogDescription>
            {entry.employee_name || entry.employee_email} ·{' '}
            {moment(entry.clock_in).format('ddd D MMM, h:mm A')}
            {entry.clock_out ? ` – ${moment(entry.clock_out).format('h:mm A')}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Total hours paid</Label>
            <Input
              type="number"
              min="0"
              step="0.25"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Break minutes</Label>
            <Input
              type="number"
              min="0"
              step="5"
              value={breakMins}
              onChange={(e) => setBreakMins(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save adjustment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}