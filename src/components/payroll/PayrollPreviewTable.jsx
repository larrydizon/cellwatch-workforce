import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export default function PayrollPreviewTable({ lines = [], onRateChange }) {
  const [draft, setDraft] = useState({});

  if (lines.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        No approved hours in this period.
      </div>
    );
  }

  const commit = (email) => {
    if (draft[email] === undefined) return;
    onRateChange(email, draft[email]);
    setDraft(prev => {
      const next = { ...prev };
      delete next[email];
      return next;
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Employee</th>
            <th className="py-2 px-3 font-medium text-right">Regular</th>
            <th className="py-2 px-3 font-medium text-right">Overtime</th>
            <th className="py-2 px-3 font-medium text-right">Total</th>
            <th className="py-2 px-3 font-medium text-right">Rate /h</th>
            <th className="py-2 pl-3 font-medium text-right">Gross</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(line => {
            const key = line.employee_email || line.employee_name;
            const rateValue = draft[key] !== undefined ? draft[key] : (line.hourly_rate || '');
            return (
              <tr key={key} className="border-b border-border last:border-0">
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{line.employee_name}</span>
                    {!line.hourly_rate && (
                      <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-[10px] text-amber-700">
                        <AlertCircle className="h-3 w-3" /> No rate
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right">{line.regular_hours.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right">{line.overtime_hours.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right font-medium">
                  {(line.regular_hours + line.overtime_hours).toFixed(2)}
                </td>
                <td className="py-2.5 px-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={rateValue}
                    onChange={(e) => setDraft(prev => ({ ...prev, [key]: e.target.value }))}
                    onBlur={() => commit(key)}
                    className="ml-auto h-8 w-24 text-right"
                  />
                </td>
                <td className="py-2.5 pl-3 text-right font-semibold">${line.gross_pay.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}