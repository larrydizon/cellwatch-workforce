import moment from 'moment';

const escapeCsv = (value) => {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function buildPayrollRows(entries = []) {
  const byEmployee = {};

  entries.forEach(entry => {
    const key = entry.employee_email || entry.employee_name || 'unknown';
    if (!byEmployee[key]) {
      byEmployee[key] = {
        name: entry.employee_name || entry.employee_email || 'Unknown',
        totalHours: 0,
        overtimeHours: 0,
      };
    }
    const hours = entry.total_hours || 0;
    byEmployee[key].totalHours += hours;
    if (entry.is_overtime) byEmployee[key].overtimeHours += hours;
  });

  return Object.values(byEmployee).sort((a, b) => a.name.localeCompare(b.name));
}

export function exportPayrollCSV(entries = []) {
  const rows = buildPayrollRows(entries);
  if (rows.length === 0) return 0;

  const headers = ['Employee', 'Total Hours', 'Overtime Hours', 'Regular Hours'];
  const body = rows.map(r => [
    r.name,
    r.totalHours.toFixed(2),
    r.overtimeHours.toFixed(2),
    (r.totalHours - r.overtimeHours).toFixed(2),
  ]);

  const csv = [headers, ...body].map(r => r.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payroll-${moment().format('YYYY-MM-DD')}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  return rows.length;
}