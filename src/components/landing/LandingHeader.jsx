import React from 'react';
import { Button } from '@/components/ui/button';

export default function LandingHeader({ onStartTrial, onSignIn }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <span className="font-heading text-lg font-bold tracking-tight">Cellwatch</span>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onSignIn}>Sign in</Button>
          <Button size="sm" onClick={() => onStartTrial('starter')}>Start free trial</Button>
        </div>
      </div>
    </header>
  );
}