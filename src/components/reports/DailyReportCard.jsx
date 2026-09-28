import React from 'react';
import moment from 'moment';
import { Badge } from '@/components/ui/badge';

export default function DailyReportCard({ report }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{report.employee_name || report.employee_email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {moment(report.report_date).format('dddd, D MMMM YYYY')}
            {report.submitted_at && ` · filed ${moment(report.submitted_at).format('h:mm A')}`}
          </p>
        </div>
        {report.filed_by_admin && (
          <Badge variant="outline" className="text-xs">Filed by admin</Badge>
        )}
      </div>

      <div className="space-y-3">
        {(report.entries || []).map((entry, index) => (
          <div key={index} className="border-t border-border pt-3 first:border-0 first:pt-0">
            <p className="text-xs font-medium text-primary">{entry.job_title || 'General work'}</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-0.5">{entry.work_done}</p>
          </div>
        ))}
      </div>
    </div>
  );
}