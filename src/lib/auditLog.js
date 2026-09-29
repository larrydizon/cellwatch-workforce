// Append-only audit trail for the organization. Writing is best-effort: an
// audit failure must never block the action the user actually asked for.
import { base44 } from '@/api/base44Client';

export const AUDIT_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'billing', label: 'Billing' },
  { value: 'seats', label: 'Seats' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'system', label: 'System Jobs' },
  { value: 'security', label: 'Security' },
  { value: 'general', label: 'General' },
];

export const CATEGORY_STYLES = {
  billing: 'bg-primary/10 text-primary',
  seats: 'bg-chart-4/15 text-chart-4',
  payroll: 'bg-warning/10 text-warning',
  system: 'bg-muted text-muted-foreground',
  security: 'bg-destructive/10 text-destructive',
  general: 'bg-success/10 text-success',
};

export async function logAudit(organizationId, entry) {
  if (!organizationId || !entry?.action) return null;
  try {
    return await base44.entities.AuditLog.create({ organization_id: organizationId, ...entry });
  } catch {
    return null;
  }
}

export function auditToCsv(entries) {
  const header = ['timestamp', 'category', 'action', 'detail', 'target', 'actor'];
  const rows = entries.map((e) => [
    e.created_date || '',
    e.category || '',
    e.action || '',
    (e.detail || '').replace(/"/g, '""'),
    e.target || '',
    e.actor_email || 'system',
  ]);
  return [header, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');
}