import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function CtaBand({ onStartTrial }) {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-14 text-center md:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_0%,hsl(var(--primary)/0.18),transparent)]" />

          <div className="relative">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Start your free trial today
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Get your whole operation onto one clock. 14 days free, no card required, and your
              crew can be clocking in this afternoon.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" className="h-12 gap-2 px-7 text-base" onClick={() => onStartTrial('starter')}>
                Start free trial <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-7 text-base" asChild>
                <a href="#pricing">Compare plans</a>
              </Button>
            </div>

            <p className="mt-5 text-sm text-muted-foreground">Cancel anytime · No setup fees</p>
          </div>
        </div>
      </div>
    </section>
  );
}