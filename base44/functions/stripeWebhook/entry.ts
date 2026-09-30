import Stripe from 'npm:stripe@17.7.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const SEATS: Record<string, number> = { free: 5, starter: 15, pro: 50 };

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

    if (event.type === 'checkout.session.completed') {
      const plan = object.metadata?.plan;
      await svc.entities.Organization.update(org.id, {
        plan,
        plan_status: 'active',
        seat_limit: SEATS[plan] ?? org.seat_limit,
        stripe_customer_id: String(object.customer),
        stripe_subscription_id: String(object.subscription),
      });
    }

    if (event.type.startsWith('customer.subscription.')) {
      const plan = object.metadata?.plan || org.plan;
      const status = object.status === 'active' || object.status === 'trialing'
        ? 'active'
        : object.status === 'canceled'
          ? 'canceled'
          : 'past_due';
      await svc.entities.Organization.update(org.id, {
        plan,
        plan_status: status,
        seat_limit: SEATS[plan] ?? org.seat_limit,
        stripe_subscription_id: object.id,
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
    return Response.json({ error: error?.message || 'Invalid webhook' }, { status: 400 });
  }
}
