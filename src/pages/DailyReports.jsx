import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, Plus } from 'lucide-react';
import DailyReportCard from '@/components/reports/DailyReportCard';
import DailyReportModal from '@/components/reports/DailyReportModal';
import { isAdminUser } from '@/lib/employeeProfile';

export default function DailyReports() {
  const { user } = useOutletContext();
  const [filingOpen, setFilingOpen] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState(' ');

  const { data: levels = [] } = useQuery({
    queryKey: ['user-levels', user?.organization_id],
    queryFn: () => base44.entities.UserLevel.filter({ organization_id: user.organization_id }, 'created_date', 100),
    enabled: !!user?.organization_id,
  });

  const isAdmin = isAdminUser(user, levels);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', user?.organization_id],
    queryFn: () => base44.entities.Employee.filter({ organization_id: user.organization_id }, 'full_name', 200),
    enabled: !!user?.organization_id && isAdmin,
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['daily-reports', user?.email, isAdmin, employeeFilter],
    queryFn: () => {
      if (!isAdmin) {
        return base44.entities.DailyReport.filter(
          { organization_id: user.organization_id, employee_email: user.email },
          '-report_date',
          100
        );
      }
      const filter = { organization_id: user.organization_id };
      if (employeeFilter !== ' ') filter.employee_email = employeeFilter;
      return base44.entities.DailyReport.filter(filter, '-report_date', 100);
    },
    enabled: !!user?.email && !!user?.organization_id,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? `${reports.length} reports` : 'What you have reported each day'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-52"><SelectValue placeholder="All employees" /></SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All employees</SelectItem>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.email}>{e.full_name || e.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setFilingOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> File Report
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No daily reports yet</p>
          <p className="text-sm mt-1">
            {isAdmin
              ? 'Reports appear here once employees file them at clock-out.'
              : 'File your report when you clock out.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <DailyReportCard key={report.id} report={report} />
          ))}
        </div>
      )}

      {isAdmin && (
        <DailyReportModal
          open={filingOpen}
          onOpenChange={setFilingOpen}
          employees={employees}
          organizationId={user?.organization_id}
          filedBy={user?.email}
          allowDateChange
        />
      )}
    </div>
  );
}