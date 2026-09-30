import React from 'react';
import { UserPlus, Smartphone, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Set up your company',
    text: 'Create a workspace, invite your crew and set the roles that decide who sees what.',
  },
  {
    icon: Smartphone,
    step: '02',
    title: 'Crews work the day',
    text: 'They clock in on site with GPS, complete pre-start forms and log the jobs they worked.',
  },
  {
    icon: CheckCircle2,
    step: '03',
    title: 'Approve and pay',
    text: 'Review hours and daily reports, approve timesheets, then run the pay period in one pass.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          From sign-up to payday in three steps
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Most companies are running their first shift on Cellwatch the same day they sign up.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="relative rounded-xl border border-border bg-card p-6">
              <span className="font-mono text-xs text-primary">{item.step}</span>
              <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 font-heading text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}