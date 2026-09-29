// Append-only audit trail. Scheduled jobs write through the service role so the
// entry is recorded regardless of which employee triggered the work.

export async function writeAudit(base44: any, entry: any) {
  if (!entry?.organization_id || !entry?.action) return null;
  return base44.asServiceRole.entities.AuditLog.create({
    category: 'general',
    actor_name: 'System',
    ...entry,
  });
}