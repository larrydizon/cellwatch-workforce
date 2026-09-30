import Stripe from 'npm:stripe@17.7.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Opens Stripe's hosted billing portal for the organization owner, where they
// update the payment method, download invoices and cancel. Owner-only: the
// session is scoped to the organization's own Stripe customer.
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
    if (!org.stripe_customer_id) {
      return Response.json({ error: 'Choose a plan first to set up billing' }, { status: 409 });
    }

    const body: any = await req.json().catch(() => ({}));
    const secret = Deno.env.get('STRIPE_SECRET_KEY');
    const appUrl = Deno.env.get('APP_URL') || String(body.returnUrl || '');
    if (!secret || !/^https:\/\//.test(appUrl)) {
      return Response.json({ error: 'Billing is not configured' }, { status: 503 });
    }

    const stripe = new Stripe(secret);
    // The portal configuration allows card updates, invoice history and
    // cancelling at the end of the paid period.
    const configuration = Deno.env.get('STRIPE_PORTAL_CONFIG_ID');
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${appUrl}/billing?portal=return`,
      ...(configuration ? { configuration } : {}),
    });
    return Response.json({ url: session.url });
  } catch (error: any) {
    console.error('createPortalSession failed:', error?.message);
    return Response.json({ error: error?.message || 'Unable to open billing portal' }, { status: 500 });
  }
}