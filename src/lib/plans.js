// SaaS subscription plans.
// Replace the `priceId` values with your real Stripe Price IDs
// (Stripe Dashboard → Products → copy the price_xxx for each plan).
// The "free" plan needs no priceId; "enterprise" is contact-sales (no checkout).

export const PLANS = [
  {
    key: "free",
    name: "Free",
    price: 0,
    priceId: null,
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
    priceId: "price_REPLACE_STARTER",
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
    priceId: "price_REPLACE_PRO",
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
    priceId: null,
    seats: null,
    period: "custom",
    description: "Large organizations",
    features: ["Unlimited employees", "SSO & custom roles", "Dedicated support", "Custom integrations"],
    highlighted: false,
  },
];