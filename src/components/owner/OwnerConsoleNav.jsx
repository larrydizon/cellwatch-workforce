import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const LINKS = [
  { to: '/owner-dashboard', label: 'Overview' },
  { to: '/owner-console', label: 'Workspaces' },
];

export default function OwnerConsoleNav() {
  const { pathname } = useLocation();

  return (
    <nav className="flex items-center gap-1 rounded-lg bg-muted/60 p-1">
      {LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            pathname === link.to ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}