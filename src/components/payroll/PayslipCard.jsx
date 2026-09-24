import React from 'react';
import moment from 'moment';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function PayslipCard({ payslip }) {
  const totalHours = (payslip.regular_hours || 0) + (payslip.overtime_hours || 0);
  const isPaid = payslip.status === 'paid';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              {moment(payslip.period_start).format('D MMM')} – {moment(payslip.period_end).format('D MMM YYYY')}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Pay period</p>
          </div>
          <Badge
            variant="outline"
            className={isPaid
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'}
          >
            {payslip.status}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Hours</p>
            <p className="text-sm font-semibold">{totalHours.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Overtime</p>
            <p className="text-sm font-semibold">{(payslip.overtime_hours || 0).toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rate</p>
            <p className="text-sm font-semibold">${(payslip.hourly_rate || 0).toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Gross pay</span>
          <span className="text-lg font-bold">${(payslip.gross_pay || 0).toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}