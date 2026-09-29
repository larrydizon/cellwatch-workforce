import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, ClipboardList, Lock } from 'lucide-react';
import moment from 'moment';

// Automated Actions Summary: what the system did on its own today.
export default function AutomatedActionsPanel({ organizationId }) {
  const today = moment().startOf('day').toISOString();

  // One aggregate covers both audit counters (auto-closed shifts + overdue forms).
  const { data: auditRows = [] } = useQuery({
    queryKey: ['automation-summary', organizationId, today],
    queryFn: () => base44.entities.AuditLog.aggregate({
      query: { organization_id: organizationId, created_date: { $gte: today } },
      groupBy: 'action',
    }),
    enabled: !!organizationId,
    refetchInterval: 120000,
  });

  const { data: lockedPeriods = 0 } = useQuery({
    queryKey: ['locked-payroll-periods', organizationId],
    queryFn: () => base44.entities.PayrollRun.count({ organization_id: organizationId, status: 'paid' }),
    enabled: !!organizationId,
  });

  const rows = auditRows.rows || [];
  const countFor = (action) => rows.find((r) => r.action === action)?.count || 0;

  const items = [
    { label: 'Shifts auto-closed today', value: countFor('shift_auto_closed'), icon: Clock, color: 'text-warning' },
    { label: 'Overdue forms flagged today', value: countFor('form_marked_overdue'), icon: ClipboardList, color: 'text-destructive' },
    { label: 'Locked payroll periods', value: lockedPeriods, icon: Lock, color: 'text-success' },
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-5 h-full">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Automated Actions</p>
      <p className="text-xs text-muted-foreground mt-1">What ran without anyone watching</p>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-md border border-border/60 bg-background/40 px-3 py-3">
            <item.icon className={`h-5 w-5 flex-shrink-0 ${item.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{item.label}</p>
            </div>
            <p className="text-xl font-bold font-heading tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}