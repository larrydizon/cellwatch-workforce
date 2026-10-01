import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LocationHistoryFilters({
  canViewAll,
  employees = [],
  selectedEmail,
  onSelectEmail,
  date,
  onDateChange,
  onClear,
  clearing,
  hasData,
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {canViewAll && (
          <div className="space-y-2">
            <Label>Worker</Label>
            <Select value={selectedEmail || ''} onValueChange={onSelectEmail}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a worker..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.email}>
                    {employee.full_name || employee.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label>Day</Label>
          <Input
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </div>
      </div>

      {canViewAll && hasData && (
        confirming ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <p className="text-xs text-muted-foreground mr-auto">
              Delete every trail point and presence check for this worker on this day?
            </p>
            <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={clearing}
              onClick={async () => {
                await onClear();
                setConfirming(false);
              }}
            >
              {clearing ? 'Clearing...' : 'Clear history'}
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear history for this day
          </Button>
        )
      )}
    </div>
  );
}