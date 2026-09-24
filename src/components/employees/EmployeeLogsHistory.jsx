import React from 'react';
import moment from 'moment';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import LocationMapLink from '@/components/timeclock/LocationMapLink';

const statusStyles = {
  active: 'bg-success/10 text-success border-success/20',
  pending_approval: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-slate-50 text-slate-700 border-slate-200',
  adjustment_requested: 'bg-violet-50 text-violet-700 border-violet-200',
};

export default function EmployeeLogsHistory({ timeEntries = [] }) {
  if (timeEntries.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-6">No clock-in history yet</p>;
  }

  return (
    <div className="space-y-3">
      {timeEntries.map(entry => (
        <div key={entry.id} className="border border-border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                {moment(entry.clock_in).format('ddd, D MMM YYYY')}
              </span>
            </div>
            <Badge variant="outline" className={`text-[10px] ${statusStyles[entry.status] || ''}`}>
              {entry.status?.replace(/_/g, ' ')}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              {moment(entry.clock_in).format('h:mm A')} – {entry.clock_out ? moment(entry.clock_out).format('h:mm A') : 'Active'}
            </span>
            {entry.total_hours != null && <span>{entry.total_hours}h</span>}
            {entry.job_title && <span className="truncate">· {entry.job_title}</span>}
          </div>

          {(entry.clock_in_lat != null || entry.clock_out_lat != null) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-border">
              {entry.clock_in_lat != null && (
                <LocationMapLink lat={entry.clock_in_lat} lng={entry.clock_in_lng} label="Clock in" />
              )}
              {entry.clock_out_lat != null && (
                <LocationMapLink lat={entry.clock_out_lat} lng={entry.clock_out_lng} label="Clock out" />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}