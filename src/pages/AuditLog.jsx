import React from 'react';
import { useOutletContext } from 'react-router-dom';
import AuditFeed from '@/components/audit/AuditFeed';

export default function AuditLog() {
  const { user } = useOutletContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-heading">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every key action across billing, seats, payroll and system jobs
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <AuditFeed
          organizationId={user?.organization_id}
          limit={200}
          showFilters
          actorEmail={user?.email}
        />
      </div>
    </div>
  );
}