import React from 'react';
import LegalPage, { LegalSection } from '@/components/legal/LegalPage';

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="6 November 2026"
      intro="These terms govern use of Cellwatch Workforce. By creating a workspace or using one, your company agrees to them, and the people it invites agree to them too. If you are accepting on behalf of a company, you confirm you are authorised to do so."
    >
      <LegalSection heading="Your workspace">
        <p>
          A workspace belongs to the company that created it. Its owner manages the subscription,
          invites people, and decides what the workspace records. You are responsible for keeping
          login details secure and for the activity of the people you invite.
        </p>
      </LegalSection>

      <LegalSection heading="Trial">
        <p>
          A new workspace starts on a 14-day trial of the plan chosen at sign-up, with no payment
          details required. When the trial ends the workspace becomes read-only until a plan is
          purchased. Nothing is deleted, and the data becomes fully available again once the
          subscription is active.
        </p>
      </LegalSection>

      <LegalSection heading="Plans, seats and payment">
        <p>
          Plans are billed monthly per workspace and include the seat allowance shown on the pricing
          page. Payment is processed by Stripe. Your plan renews automatically until cancelled, and
          you can cancel at any time from the billing page; access continues to the end of the paid
          period. Paid amounts are not refundable except where the law requires it. If a payment
          fails, the workspace becomes read-only after Stripe's retry window.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>
          Do not use the platform to break the law, to monitor anyone without their knowledge or
          consent, to upload malicious code, to attempt to reach another company's data, or to
          resell access without our written agreement. Location and presence features must be used
          only as permitted by the employment and privacy law that applies to your workers.
        </p>
      </LegalSection>

      <LegalSection heading="Your data, our software">
        <p>
          Your company owns the records it puts into its workspace. We own the software, and grant
          your company a right to use it while the subscription is active. We use aggregated,
          de-identified figures to operate and improve the service, and never sell your data.
        </p>
      </LegalSection>

      <LegalSection heading="Availability and support">
        <p>
          We aim to keep the service available at all times, but it may be interrupted for
          maintenance, updates or events outside our control. Support is available to workspace
          administrators through the contact details on our website.
        </p>
      </LegalSection>

      <LegalSection heading="Liability">
        <p>
          To the extent the law allows, our total liability for any claim relating to the service is
          limited to the amount your company paid us in the twelve months before the claim. We are
          not liable for indirect or consequential loss. Nothing in these terms limits rights that
          cannot be excluded under the Consumer Guarantees Act 1993 or the Fair Trading Act 1986.
        </p>
      </LegalSection>

      <LegalSection heading="Ending the agreement">
        <p>
          You can stop using the service at any time. We may suspend or end a workspace that breaches
          these terms, that is used to harm others, or that is unpaid. On request, we will make your
          company's data available for export before a workspace is closed.
        </p>
      </LegalSection>

      <LegalSection heading="Changes and governing law">
        <p>
          We may update these terms; the version in force is the one published here when you use the
          service. These terms are governed by New Zealand law, and the New Zealand courts have
          jurisdiction over any dispute.
        </p>
      </LegalSection>
    </LegalPage>
  );
}