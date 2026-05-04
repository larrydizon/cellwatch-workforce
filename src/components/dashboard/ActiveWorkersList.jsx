import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import moment from 'moment';

export default function ActiveWorkersList({ timeEntries = [] }) {
  const active = timeEntries.filter(t => t.status === 'active');

  if (active.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No workers currently clocked in
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {active.map((entry) => (
        <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
          <div className="h-9 w-9 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
            <span className="text-success font-semibold text-xs">
              {entry.employee_name?.split(' ').map(n => n[0]).join('') || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{entry.employee_name || entry.employee_email}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Since {moment(entry.clock_in).format('h:mm A')}
              </span>
            </div>
          </div>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
            Active
          </Badge>
        </div>
      ))}
    </div>
  );
}