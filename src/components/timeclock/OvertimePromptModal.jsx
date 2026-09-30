import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlarmClock, LogOut, Timer } from 'lucide-react';
import { SHIFT_LIMIT_HOURS } from '@/lib/shiftLimits';
import { runTimeEntryCommand } from '@/lib/timeEntries';

const EXTRA_OPTIONS = [0.5, 1, 2, 3, 4];

export default function OvertimePromptModal({ entry }) {
  const [extraHours, setExtraHours] = useState(1);
  const queryClient = useQueryClient();
  const open = !!entry;

  // Sound the alarm when the reminder appears
  useEffect(() => {
    if (!open) return;
    setExtraHours(1);
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
      setTimeout(() => ctx.close(), 1500);
    } catch (e) {
      // sound blocked by the browser — the on-screen reminder still shows
    }
  }, [open, entry?.id]);

  const decideMutation = useMutation({
    mutationFn: (data) => runTimeEntryCommand('overtime_decision', { entry_id: entry.id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime-prompt-entry'] });
      queryClient.invalidateQueries({ queryKey: ['auto-clockout-active'] });
      queryClient.invalidateQueries({ queryKey: ['my-active-entry'] });
      queryClient.invalidateQueries({ queryKey: ['active-time-entry'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });

  if (!entry) return null;

  const clockIn = moment(entry.clock_in);
  const autoClockOut = clockIn.clone().add(SHIFT_LIMIT_HOURS, 'hours').add(entry.break_minutes || 0, 'minutes');
  const elapsed = Math.max(0, moment().diff(clockIn, 'hours', true) - (entry.break_minutes || 0) / 60);

  const accept = () => decideMutation.mutate({
    decision: 'accepted',
    overtime_hours: Math.max(0.5, Number(extraHours) || 0),
  });

  const decline = () => decideMutation.mutate({ decision: 'declined', overtime_hours: 0 });

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-warning/10 flex items-center justify-center">
              <AlarmClock className="h-4 w-4 text-warning" />
            </div>
            <div>
              <DialogTitle>Your {SHIFT_LIMIT_HOURS} hour shift is nearly up</DialogTitle>
              <DialogDescription>
                Clocked in at {clockIn.format('h:mm A')} — {elapsed.toFixed(1)}h so far
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted/60 p-3 flex items-start gap-2">
            <Timer className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Your shift will close automatically at{' '}
              <span className="font-medium text-foreground">{autoClockOut.format('h:mm A')}</span>{' '}
              and go to your admin for approval. Do you want to keep working overtime?
            </p>
          </div>

          <div className="space-y-2">
            <Label>Extra hours needed before auto clock-out</Label>
            <div className="flex flex-wrap gap-2">
              {EXTRA_OPTIONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setExtraHours(h)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    Number(extraHours) === h
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  +{h}h
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0.5"
                max="12"
                step="0.5"
                value={extraHours}
                onChange={(e) => setExtraHours(e.target.value)}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">
                hours — auto clock-out at {clockIn.clone().add(SHIFT_LIMIT_HOURS, 'hours').add(Number(extraHours) || 0, 'hours').add(entry.break_minutes || 0, 'minutes').format('h:mm A')}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="gap-2"
            disabled={decideMutation.isPending}
            onClick={decline}
          >
            <LogOut className="h-4 w-4" />
            No — finish at {SHIFT_LIMIT_HOURS}h
          </Button>
          <Button
            className="gap-2"
            disabled={decideMutation.isPending}
            onClick={accept}
          >
            <Timer className="h-4 w-4" />
            Yes — work overtime
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
