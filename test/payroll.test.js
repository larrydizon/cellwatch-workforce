import test from 'node:test';
import assert from 'node:assert/strict';
import { computePayrollLines, payrollTotals } from '../src/lib/payroll.js';

test('splits an overtime shift instead of multiplying the entire shift', () => {
  const lines = computePayrollLines([
    { employee_email: 'worker@example.com', employee_name: 'Worker', total_hours: 10, is_overtime: true },
  ], [
    { employee_email: 'worker@example.com', hourly_rate: 30, overtime_multiplier: 1.5 },
  ]);

  assert.equal(lines[0].regular_hours, 8);
  assert.equal(lines[0].overtime_hours, 2);
  assert.equal(lines[0].gross_pay, 330);
});

test('aggregates regular entries and produces stable totals', () => {
  const lines = computePayrollLines([
    { employee_email: 'worker@example.com', employee_name: 'Worker', total_hours: 4 },
    { employee_email: 'worker@example.com', employee_name: 'Worker', total_hours: 3.5 },
  ], [{ employee_email: 'worker@example.com', hourly_rate: 20 }]);

  assert.deepEqual(payrollTotals(lines), { hours: 7.5, overtime: 0, gross: 150 });
});
