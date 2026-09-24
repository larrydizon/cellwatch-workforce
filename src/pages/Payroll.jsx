import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Play, ShieldAlert } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import {
  computePayrollLines,
  payrollTotals,
  exportPayrollLinesCSV,
  DEFAULT_OT_MULTIPLIER,
} from '@/lib/payroll';
import PayrollPreviewTable from '@/components/payroll/PayrollPreviewTable';
import PayrollRunsList from '@/components/payroll/PayrollRunsList';

export default function Payroll() {
  const { user } = useOutletContext();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('new');
  const [periodStart, setPeriodStart] = useState(moment().startOf('month').format('YYYY-MM-DD'));
  const [periodEnd, setPeriodEnd] = useState(moment().endOf('month').format('YYYY-MM-DD'));
  const [processing, setProcessing] = useState(false);

  const isAdmin = ['admin', 'operations_manager', 'supervisor'].includes(user?.role);

  const { data: entries = [] } = useQuery({
    queryKey: ['payroll-entries'],
    queryFn: () => base44.entities.TimeEntry.filter({ status: 'approved' }, '-clock_in', 500),
    enabled: !!user?.email && isAdmin,
  });

  const { data: rates = [] } = useQuery({
    queryKey: ['pay-rates'],
    queryFn: () => base44.entities.PayRate.list('-created_date', 500),
    enabled: !!user?.email && isAdmin,
  });

  const { data: runs = [] } = useQuery({
    queryKey: ['payroll-runs'],
    queryFn: () => base44.entities.PayrollRun.list('-period_end', 50),
    enabled: !!user?.email && isAdmin,
  });

  const lines = useMemo(() => {
    const periodEntries = entries.filter(
      e =>
        e.clock_in &&
        moment(e.clock_in).isSameOrAfter(moment(periodStart), 'day') &&
        moment(e.clock_in).isSameOrBefore(moment(periodEnd), 'day')
    );
    return computePayrollLines(periodEntries, rates);
  }, [entries, rates, periodStart, periodEnd]);

  const totals = useMemo(() => payrollTotals(lines), [lines]);

  const handleRateChange = async (email, value) => {
    const hourlyRate = value === '' ? 0 : Number(value);
    if (Number.isNaN(hourlyRate)) return;

    const existing = rates.find(r => r.employee_email === email);
    const name = lines.find(l => l.employee_email === email)?.employee_name;

    if (existing) {
      await base44.entities.PayRate.update(existing.id, { hourly_rate: hourlyRate });
    } else {
      await base44.entities.PayRate.create({
        organization_id: user?.data?.organization_id,
        employee_email: email,
        employee_name: name,
        hourly_rate: hourlyRate,
        overtime_multiplier: DEFAULT_OT_MULTIPLIER,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['pay-rates'] });
  };

  const processPayroll = async () => {
    if (lines.length === 0) {
      toast.error('No approved hours in this period');
      return;
    }
    const missing = lines.filter(l => !l.hourly_rate);
    if (missing.length > 0) {
      toast.error(`Set pay rates for ${missing.length} employee${missing.length === 1 ? '' : 's'} first`);
      return;
    }

    setProcessing(true);
    try {
      await base44.entities.PayrollRun.create({
        organization_id: user?.data?.organization_id,
        period_start: periodStart,
        period_end: periodEnd,
        status: 'processed',
        lines,
        total_hours: totals.hours,
        total_overtime_hours: totals.overtime,
        total_gross: totals.gross,
        employee_count: lines.length,
        processed_by: user?.email,
        processed_at: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      toast.success('Payroll run created');
      setTab('history');
    } finally {
      setProcessing(false);
    }
  };

  const exportRun = (run) => {
    exportPayrollLinesCSV(run.lines || [], `payroll-${run.period_start}-to-${run.period_end}.csv`);
    toast.success('Payroll exported');
  };

  const markPaid = async (run) => {
    await base44.entities.PayrollRun.update(run.id, { status: 'paid' });
    queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
    toast.success('Marked as paid');
  };

  const deleteRun = async (run) => {
    await base44.entities.PayrollRun.delete(run.id);
    queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
    toast.success('Payroll run deleted');
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="mb-3 h-12 w-12 text-muted-foreground opacity-30" />
        <p className="font-medium">Payroll is restricted</p>
        <p className="text-sm text-muted-foreground">Only administrators can access payroll.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate payroll from approved timesheets
          </p>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="new">New Run</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {tab === 'new' ? (
        <>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Pay Period</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="period-start">Start</Label>
                <Input
                  id="period-start"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full sm:w-44"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period-end">End</Label>
                <Input
                  id="period-end"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full sm:w-44"
                />
              </div>
              <div className="sm:ml-auto">
                <Button onClick={processPayroll} disabled={processing} className="w-full gap-2 sm:w-auto">
                  <Play className="h-4 w-4" />
                  {processing ? 'Processing…' : 'Process Payroll'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Employees</p>
              <p className="mt-1 text-xl font-bold">{lines.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Total Hours</p>
              <p className="mt-1 text-xl font-bold">{totals.hours.toFixed(1)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Overtime Hours</p>
              <p className="mt-1 text-xl font-bold">{totals.overtime.toFixed(1)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Total Gross</p>
              <p className="mt-1 text-xl font-bold">${totals.gross.toFixed(2)}</p>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4 text-primary" /> Employees in Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PayrollPreviewTable lines={lines} onRateChange={handleRateChange} />
            </CardContent>
          </Card>
        </>
      ) : (
        <PayrollRunsList runs={runs} onExport={exportRun} onMarkPaid={markPaid} onDelete={deleteRun} />
      )}
    </div>
  );
}