import Stripe from 'npm:stripe@17.7.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const PRICE_ENV: Record<string, string> = {
  starter: 'STRIPE_STARTER_PRICE_ID',
  pro: 'STRIPE_PRO_PRICE_ID',
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user: any = await base44.auth.me().catch(() => null);
    if (!user?.email || !user?.organization_id) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const org: any = await base44.asServiceRole.entities.Organization.get(user.organization_id);
    if (!org || org.owner_email?.toLowerCase() !== user.email.toLowerCase()) {
      return Response.json({ error: 'Only the organization owner can manage billing' }, { status: 403 });
    }

    const body: any = await req.json().catch(() => ({}));
    const plan = String(body.plan || '');
    const priceEnv = PRICE_ENV[plan];
    if (!priceEnv) return Response.json({ error: 'Invalid plan' }, { status: 400 });

    const secret = Deno.env.get('STRIPE_SECRET_KEY');
    const price = Deno.env.get(priceEnv);
    const appUrl = Deno.env.get('APP_URL') || String(body.returnUrl || '');
    if (!secret || !price || !/^https:\/\//.test(appUrl)) {
      return Response.json({ error: 'Billing is not configured' }, { status: 503 });
    }

    const stripe = new Stripe(secret);
    let customerId = org.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: org.name,
        metadata: { organization_id: org.id },
      });
      customerId = customer.id;
      await base44.asServiceRole.entities.Organization.update(org.id, { stripe_customer_id: customerId });
    }

    // base44_app_id lets Base44 track the transaction; organization_id and plan
    // are what the webhook uses to update the workspace.
    const metadata = {
      organization_id: org.id,
      plan,
      base44_app_id: Deno.env.get('BASE44_APP_ID') || '',
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      success_url: `${appUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing`,
      allow_promotion_codes: true,
      client_reference_id: org.id,
      metadata,
      subscription_data: { metadata },
    });
    return Response.json({ url: session.url });
  } catch (error: any) {
    console.error('createCheckoutSession failed:', error?.message);
    return Response.json({ error: error?.message || 'Unable to start checkout' }, { status: 500 });
  }
}