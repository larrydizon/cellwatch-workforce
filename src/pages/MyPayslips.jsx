import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import PayslipCard from '@/components/payroll/PayslipCard';
import { Receipt } from 'lucide-react';

export default function MyPayslips() {
  const { user } = useOutletContext();

  const { data: payslips = [], isLoading } = useQuery({
    queryKey: ['my-payslips', user?.email],
    queryFn: () => base44.entities.Payslip.filter({ employee_email: user.email }, '-period_end', 100),
    enabled: !!user?.email,
  });

  const totalGross = payslips.reduce((sum, p) => sum + (p.gross_pay || 0), 0);
  const totalHours = payslips.reduce(
    (sum, p) => sum + (p.regular_hours || 0) + (p.overtime_hours || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Payslips</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your pay history</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Payslips</p>
          <p className="mt-1 text-xl font-bold">{payslips.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Hours</p>
          <p className="mt-1 text-xl font-bold">{totalHours.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Gross</p>
          <p className="mt-1 text-xl font-bold">${totalGross.toFixed(2)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      ) : payslips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Receipt className="mb-3 h-12 w-12 text-muted-foreground opacity-30" />
          <p className="font-medium">No payslips yet</p>
          <p className="text-sm text-muted-foreground">Your payslips will appear here once payroll runs.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {payslips.map(payslip => (
            <PayslipCard key={payslip.id} payslip={payslip} />
          ))}
        </div>
      )}
    </div>
  );
}