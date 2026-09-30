import test from 'node:test';
import assert from 'node:assert/strict';
import { SHIFT_LIMIT_HOURS, shiftLimitHours } from '../src/lib/shiftLimits.js';

test('uses the standard shift limit when overtime was not approved', () => {
  assert.equal(shiftLimitHours({ overtime_hours: 0 }), SHIFT_LIMIT_HOURS);
});

test('adds only the approved overtime allowance', () => {
  assert.equal(shiftLimitHours({ overtime_hours: 2 }), 10);
});
