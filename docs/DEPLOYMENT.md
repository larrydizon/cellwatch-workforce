# Production deployment

## Frontend variables

Configure the values from `.env.example` in the Base44 application and CI environment.

## Backend function secrets

Configure these as server-side secrets. Never expose them through `VITE_` variables:

- `APP_URL`: canonical HTTPS application origin.
- `STRIPE_SECRET_KEY`: Stripe restricted or secret key.
- `STRIPE_WEBHOOK_SECRET`: signing secret for the deployed `stripeWebhook` endpoint.
- `STRIPE_STARTER_PRICE_ID`: recurring Stripe Price for the Starter plan.
- `STRIPE_PRO_PRICE_ID`: recurring Stripe Price for the Pro plan.

Register the `stripeWebhook` endpoint for at least these Stripe events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

## Scheduled maintenance

`autoClockOutSweep` and `flagOverdueForms` now fail closed unless the request has an authenticated administrator. Before enabling their schedules, configure Base44 Workflows to invoke them with a dedicated administrator/service identity. Do not make either endpoint anonymously callable.

If the application already contains chat messages from an older release, backfill each message's `participant_emails` from its parent conversation before applying the new Message access policy. Without that one-time data migration, legacy messages intentionally remain inaccessible.

## Release gate

Every release must pass `npm run lint`, `npm test`, and `npm run build`. Test Stripe in test mode, verify tenant isolation with two separate organizations, and confirm backup restoration before onboarding a paying customer.
