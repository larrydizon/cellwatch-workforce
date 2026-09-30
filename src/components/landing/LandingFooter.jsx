import React from 'react';

export default function LandingFooter() {
  return (
    <footer>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading font-bold">Cellwatch</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Workforce management for field service teams.
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
        </div>
      </div>
      <div className="border-t border-border/60">
        <p className="mx-auto max-w-6xl px-5 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Cellwatch. All rights reserved.
        </p>
      </div>
    </footer>
  );
}