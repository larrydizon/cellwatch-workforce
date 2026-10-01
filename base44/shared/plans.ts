// Shared plan rules. Mirrors src/lib/plans.js so the public pricing page,
// workspace creation, checkout and the webhook all agree on seat limits for
// the same plan key.

export const PLAN_SEATS: Record<string, number | null> = {
  free: 5,
  starter: 15,
  pro: 50,
  enterprise: null,
};

// Seat limit for a plan key; falls back when the plan is unknown.
export function planSeatLimit(plan: string, fallback: number | null = 5): number | null {
  const seats = PLAN_SEATS[plan];
  return seats === undefined ? fallback : seats;
}

// Monthly list price in USD per plan key. Mirrors src/lib/plans.js. Used by
// owner-only reporting so revenue is derived from the plan actually stored on
// each organization record rather than from anything a customer can send us.
export const PLAN_MONTHLY_PRICE: Record<string, number> = {
  free: 0,
  starter: 29,
  pro: 99,
  // Enterprise is quoted per contract, so it carries no list price.
  enterprise: 0,
};

export function planMonthlyPrice(plan: string): number {
  return PLAN_MONTHLY_PRICE[plan] ?? 0;
}

// Only plan keys we actually sell are accepted from the client.
export function normalizePlan(plan: unknown): string {
  const key = String(plan || '');
  return key in PLAN_SEATS ? key : 'free';
}