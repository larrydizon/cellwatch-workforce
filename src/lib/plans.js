// SaaS subscription plans.
// Stripe Price IDs are intentionally server-only. The checkout function maps
// these public plan keys to STRIPE_*_PRICE_ID secrets.

export const PLANS = [
  {
    key: "free",
    name: "Free",
    price: 0,
    checkout: false,
    seats: 5,
    period: "forever",
    description: "Get started solo",
    features: ["Up to 5 employees", "Time clock & timesheets", "Basic forms", "Community support"],
    highlighted: false,
  },
  {
    key: "starter",
    name: "Starter",
    price: 29,
    checkout: true,
    seats: 15,
    period: "month",
    description: "Small teams",
    features: ["Up to 15 employees", "All Free features", "Pre-start forms & assignments", "Leave management"],
    highlighted: true,
  },
  {
    key: "pro",
    name: "Pro",
    price: 99,
    checkout: true,
    seats: 50,
    period: "month",
    description: "Growing field teams",
    features: ["Up to 50 employees", "All Starter features", "Certificates & training", "Live field map", "Priority support"],
    highlighted: false,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: null,
    checkout: false,
    seats: null,
    period: "custom",
    description: "Large organizations",
    features: ["Unlimited employees", "SSO & custom roles", "Dedicated support", "Custom integrations"],
    highlighted: false,
  },
];
