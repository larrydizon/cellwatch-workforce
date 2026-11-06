import Stripe from 'npm:stripe@17.7.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { PLAN_SEATS, planSeatLimit } from '../../shared/plans.ts';

// Statuses Stripe uses on a checkout session whose money has actually landed.
const SETTLED = new Set(['paid', 'no_payment_required']);

// Base44's own self-test charge carries this flag; it is never a customer order.
function isTestCheckout(object: any): boolean {
  return String(object?.metadata?.base44_test_checkout || '') === 'true';
}

// Only plan keys we actually sell may be written onto an organization.
function resolvePlan(value: unknown, fallback: string): string {
  const key = String(value || '');
  return key && key in PLAN_SEATS ? key : fallback;
}

// The subscription's own price is the authoritative source, so a plan cannot be
// asserted by a stale metadata value or a tampered checkout payload.
function planFromPriceId(priceId: unknown, fallback: string): string {
  const id = String(priceId || '');
  if (!id) return fallback;
  if (id === Deno.env.get('STRIPE_STARTER_PRICE_ID')) return 'starter';
  if (id === Deno.env.get('STRIPE_PRO_PRICE_ID')) return 'pro';
  return fallback;
}

export default async function (req: Request): Promise<Response> {
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const signature = req.headers.get('stripe-signature');
  if (!stripeSecret || !webhookSecret || !signature) {
    return Response.json({ error: 'Webhook is not configured' }, { status: 503 });
  }

  try {
    const stripe = new Stripe(stripeSecret);
    const rawBody = await req.text();
    const event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const object: any = event.data.object;
    let organizationId = object.metadata?.organization_id;
    let org: any = organizationId ? await svc.entities.Organization.get(organizationId) : null;
    if (!org && object.customer) {
      const found: any = await svc.entities.Organization.filter(
        { stripe_customer_id: String(object.customer) },
        { limit: 1 }
      );
      org = (Array.isArray(found) ? found : found?.items || [])[0];
      organizationId = org?.id;
    }
    if (!org) return Response.json({ received: true });

    // Paid access is only ever granted by a signature-verified event whose
    // payment has actually settled. `checkout.session.completed` can still be
    // unpaid when a payment method settles later, so those wait for
    // `checkout.session.async_payment_succeeded` instead of switching the
    // workspace on early.
    const isCheckout = event.type === 'checkout.session.completed'
      || event.type === 'checkout.session.async_payment_succeeded';

    if (isCheckout) {
      if (isTestCheckout(object)) {
        return Response.json({ received: true, skipped: 'test_checkout' });
      }
      const settled = event.type === 'checkout.session.async_payment_succeeded'
        || SETTLED.has(String(object.payment_status));
      if (!settled) {
        return Response.json({ received: true, pending_payment: true });
      }
      const plan = resolvePlan(object.metadata?.plan, org.plan || 'free');
      await svc.entities.Organization.update(org.id, {
        plan,
        plan_status: 'active',
        seat_limit: planSeatLimit(plan) ?? org.seat_limit,
        cancel_at_period_end: false,
        trial_ends_at: null,
        stripe_customer_id: String(object.customer),
        stripe_subscription_id: String(object.subscription),
      });
    }

    // The subscription has actually ended: the workspace falls back to the free
    // plan and its seat limit. Nothing is deleted, so an over-limit workspace
    // stays usable — the seat gauge flags it and points at an upgrade.
    if (event.type === 'customer.subscription.deleted') {
      await svc.entities.Organization.update(org.id, {
        plan: 'free',
        plan_status: 'active',
        seat_limit: planSeatLimit('free'),
        cancel_at_period_end: false,
      });
    }

    if (event.type.startsWith('customer.subscription.') && event.type !== 'customer.subscription.deleted') {
      const priceId = object.items?.data?.[0]?.price?.id;
      const plan = planFromPriceId(priceId, resolvePlan(object.metadata?.plan, org.plan || 'free'));
      const status = object.status === 'active' || object.status === 'trialing'
        ? 'active'
        : object.status === 'canceled'
          ? 'canceled'
          : 'past_due';
      await svc.entities.Organization.update(org.id, {
        plan,
        plan_status: status,
        seat_limit: planSeatLimit(plan) ?? org.seat_limit,
        stripe_subscription_id: object.id,
        // Set while the period is still running, so the app can show the end date.
        cancel_at_period_end: Boolean(object.cancel_at_period_end),
        current_period_end: object.current_period_end
          ? new Date(object.current_period_end * 1000).toISOString()
          : org.current_period_end,
      });
    }

    if (event.type === 'invoice.payment_failed') {
      await svc.entities.Organization.update(org.id, { plan_status: 'past_due' });
    }
    return Response.json({ received: true });
  } catch (error: any) {
    console.error('stripeWebhook failed:', error?.message);
    return Response.json({ error: error?.message || 'Invalid webhook' }, { status: 400 });
  }
}