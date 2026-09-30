export const DEFAULT_OT_MULTIPLIER = 1.5;

const escapeCsv = (value) => {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Groups approved time entries per employee and calculates gross pay
 * using each employee's hourly rate and overtime multiplier.
 */
export function computePayrollLines(entries = [], rates = []) {
  const rateByEmail = {};
  rates.forEach(r => {
    if (r.employee_email) rateByEmail[r.employee_email] = r;
  });

  const byEmployee = {};

  entries.forEach(entry => {
    const key = entry.employee_email || entry.employee_name || 'unknown';
    if (!byEmployee[key]) {
      byEmployee[key] = {
        employee_email: entry.employee_email || '',
        employee_name: entry.employee_name || entry.employee_email || 'Unknown',
        regular_hours: 0,
        overtime_hours: 0,
      };
    }
    const line = byEmployee[key];
    const hours = entry.total_hours || 0;
    // `total_hours` is the whole shift. An overtime flag means only the hours
    // above the standard threshold receive the multiplier, not the entire shift.
    const overtime = entry.is_overtime ? Math.max(0, hours - 8) : 0;
    line.regular_hours += Math.max(0, hours - overtime);
    line.overtime_hours += overtime;
  });

  return Object.values(byEmployee)
    .map(line => {
      const rate = rateByEmail[line.employee_email];
      const hourlyRate = rate?.hourly_rate || 0;
      const multiplier = rate?.overtime_multiplier || DEFAULT_OT_MULTIPLIER;
      const gross = line.regular_hours * hourlyRate + line.overtime_hours * hourlyRate * multiplier;
      return {
        ...line,
        hourly_rate: hourlyRate,
        overtime_multiplier: multiplier,
        gross_pay: Math.round(gross * 100) / 100,
      };
    })
    .sort((a, b) => a.employee_name.localeCompare(b.employee_name));
}

export function payrollTotals(lines = []) {
  return lines.reduce(
    (acc, l) => ({
      hours: acc.hours + l.regular_hours + l.overtime_hours,
      overtime: acc.overtime + l.overtime_hours,
      gross: acc.gross + l.gross_pay,
    }),
    { hours: 0, overtime: 0, gross: 0 }
  );
}

export function exportPayrollLinesCSV(lines = [], filename = 'payroll.csv') {
  const headers = ['Employee', 'Regular Hours', 'Overtime Hours', 'Total Hours', 'Hourly Rate', 'Gross Pay'];
  const body = lines.map(l => [
    l.employee_name,
    (l.regular_hours || 0).toFixed(2),
    (l.overtime_hours || 0).toFixed(2),
    ((l.regular_hours || 0) + (l.overtime_hours || 0)).toFixed(2),
    (l.hourly_rate || 0).toFixed(2),
    (l.gross_pay || 0).toFixed(2),
  ]);

  const csv = [headers, ...body].map(r => r.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
