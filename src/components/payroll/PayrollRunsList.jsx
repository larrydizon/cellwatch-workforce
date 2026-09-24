import React, { useState } from 'react';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export default function PayrollRunsList({ runs = [], onExport, onMarkPaid, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);

  if (runs.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        No payroll runs yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {runs.map(run => {
        const expanded = expandedId === run.id;
        return (
          <div key={run.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {moment(run.period_start).format('D MMM')} – {moment(run.period_end).format('D MMM YYYY')}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {run.employee_count} employees · {(run.total_hours || 0).toFixed(1)}h ·{' '}
                  {(run.total_overtime_hours || 0).toFixed(1)}h OT
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">${(run.total_gross || 0).toFixed(2)}</span>
                <Badge
                  variant="outline"
                  className={run.status === 'paid'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'}
                >
                  {run.status}
                </Badge>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setExpandedId(expanded ? null : run.id)}
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {expanded ? 'Hide lines' : 'View lines'}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onExport(run)}>
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
              {run.status === 'processed' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-success hover:text-success"
                  onClick={() => onMarkPaid(run)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Mark paid
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto gap-1.5 text-destructive hover:text-destructive"
                onClick={() => onDelete(run)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>

            {expanded && (
              <div className="mt-3 overflow-x-auto border-t border-border pt-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-1.5 pr-3 font-medium">Employee</th>
                      <th className="py-1.5 px-3 font-medium text-right">Regular</th>
                      <th className="py-1.5 px-3 font-medium text-right">Overtime</th>
                      <th className="py-1.5 px-3 font-medium text-right">Rate</th>
                      <th className="py-1.5 pl-3 font-medium text-right">Gross</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(run.lines || []).map((l, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="py-1.5 pr-3">{l.employee_name}</td>
                        <td className="py-1.5 px-3 text-right">{(l.regular_hours || 0).toFixed(2)}</td>
                        <td className="py-1.5 px-3 text-right">{(l.overtime_hours || 0).toFixed(2)}</td>
                        <td className="py-1.5 px-3 text-right">${(l.hourly_rate || 0).toFixed(2)}</td>
                        <td className="py-1.5 pl-3 text-right font-medium">${(l.gross_pay || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}