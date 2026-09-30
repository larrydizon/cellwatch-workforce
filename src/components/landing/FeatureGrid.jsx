import React from 'react';
import { Clock, Briefcase, ClipboardCheck, FileText, MapPin, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: Clock,
    title: 'Time clock with GPS',
    text: 'Crews clock in from their phone with location captured, breaks tracked and overtime handled automatically.',
  },
  {
    icon: Briefcase,
    title: 'Jobs & scheduling',
    text: 'Assign work, publish shifts and see who is on which site, on a board or a calendar.',
  },
  {
    icon: ClipboardCheck,
    title: 'Pre-start forms',
    text: 'Health & safety checks and inductions that must be signed off before a shift can start.',
  },
  {
    icon: FileText,
    title: 'Timesheets & payroll',
    text: 'Approve hours in one pass, then run a pay period straight from approved timesheets.',
  },
  {
    icon: MapPin,
    title: 'Live field map',
    text: 'See active workers, open shifts and job sites across the whole operation at a glance.',
  },
  {
    icon: ShieldCheck,
    title: 'Certificates & training',
    text: 'Keep tickets, licences and expiry dates against every employee, with alerts before they lapse.',
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Built for the field, run from the office
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          One place for the whole field day — no spreadsheets, no paperwork back at the yard.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-border bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 font-heading text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}