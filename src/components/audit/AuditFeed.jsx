import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AUDIT_CATEGORIES, CATEGORY_STYLES, auditToCsv, logAudit } from '@/lib/auditLog';
import { Download, FileJson, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import moment from 'moment';

export default function AuditFeed({ organizationId, limit = 25, showFilters = true, actorEmail }) {
  const [category, setCategory] = useState('all');

  const query = category === 'all'
    ? { organization_id: organizationId }
    : { organization_id: organizationId, category };

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['audit-log', organizationId, category, limit],
    queryFn: () => base44.entities.AuditLog.filter(query, '-created_date', limit),
    enabled: !!organizationId,
    refetchInterval: 60000,
  });

  const handleExport = (format) => {
    const body = format === 'csv' ? auditToCsv(entries) : JSON.stringify(entries, null, 2);
    const blob = new Blob([body], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    logAudit(organizationId, {
      category: 'security',
      action: 'audit_exported',
      detail: `Exported audit log as ${format.toUpperCase()}`,
      actor_email: actorEmail,
    });
  };

  return (
    <div className="flex flex-col">
      {showFilters && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {AUDIT_CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                  category === c.value
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <FileJson className="h-3.5 w-3.5" /> JSON
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-9 rounded-md bg-muted/60 animate-pulse" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No activity recorded yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="font-medium px-4 py-2">Time</th>
                <th className="font-medium px-4 py-2">Category</th>
                <th className="font-medium px-4 py-2">Event</th>
                <th className="font-medium px-4 py-2 hidden sm:table-cell">Actor</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-border/60 hover:bg-accent/40">
                  <td className="px-4 py-2.5 whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {moment(entry.created_date).format('DD MMM HH:mm')}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium', CATEGORY_STYLES[entry.category] || CATEGORY_STYLES.general)}>
                      {entry.category || 'general'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-foreground">{entry.detail || entry.action}</span>
                    {entry.target && <span className="text-muted-foreground"> · {entry.target}</span>}
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-xs text-muted-foreground truncate max-w-[180px]">
                    {entry.actor_name || entry.actor_email || 'System'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}