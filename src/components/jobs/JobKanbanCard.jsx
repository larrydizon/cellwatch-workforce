import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Briefcase, Clock } from 'lucide-react';

const priorityColors = {
  low: "bg-slate-50 text-slate-600",
  medium: "bg-blue-50 text-blue-600",
  high: "bg-orange-50 text-orange-600",
  urgent: "bg-red-50 text-red-600",
};

export default function JobKanbanCard({ job, onClick }) {
  return (
    <div onClick={onClick} className="bg-card rounded-lg border border-border p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono text-muted-foreground">{job.job_number}</span>
        <Badge variant="outline" className={priorityColors[job.priority]}>{job.priority}</Badge>
      </div>
      <h4 className="font-medium text-sm mt-1.5 line-clamp-2">{job.title}</h4>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
        {job.client_name && (
          <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{job.client_name}</span>
        )}
        {job.site_address && (
          <span className="flex items-center gap-1 max-w-full truncate"><MapPin className="h-3 w-3 shrink-0" />{job.site_address}</span>
        )}
        {job.estimated_hours && (
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.estimated_hours}h</span>
        )}
        {job.assigned_workers?.length > 0 && (
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.assigned_workers.length}</span>
        )}
      </div>
    </div>
  );
}