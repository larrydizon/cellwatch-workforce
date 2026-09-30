import Stripe from 'npm:stripe@17.7.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user: any = await base44.auth.me().catch(() => null);
    if (!user?.email || !user?.organization_id) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    const org: any = await base44.asServiceRole.entities.Organization.get(user.organization_id);
    if (!org || org.owner_email?.toLowerCase() !== user.email.toLowerCase()) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { sessionId } = await req.json();
    const secret = Deno.env.get('STRIPE_SECRET_KEY');
    if (!secret || !sessionId) return Response.json({ error: 'Invalid request' }, { status: 400 });
    const stripe = new Stripe(secret);
    const session: any = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
    if (session.metadata?.organization_id !== org.id || session.payment_status === 'unpaid') {
      return Response.json({ error: 'Subscription is not active for this organization' }, { status: 409 });
    }
    // The webhook remains authoritative; this endpoint only verifies the return
    // from Checkout and never accepts plan or status values from the browser.
    return Response.json({ verified: true });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'Unable to verify checkout' }, { status: 500 });
  }
}
