import React from 'react';
import { Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const statusBadgeColors = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  scheduled: "bg-violet-50 text-violet-700 border-violet-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  waiting: "bg-orange-50 text-orange-700 border-orange-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  invoiced: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function TodayJobsList({ jobs = [] }) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No jobs scheduled for today
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.slice(0, 6).map((job) => (
        <Link
          key={job.id}
          to={`/jobs?id=${job.id}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
        >
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{job.title}</p>
            {job.client_name && (
              <p className="text-xs text-muted-foreground mt-0.5">{job.client_name}</p>
            )}
          </div>
          <Badge variant="outline" className={statusBadgeColors[job.status] || ""}>
            {job.status?.replace(/_/g, ' ')}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
