import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Clock, UmbrellaOff, MessageSquare, CreditCard, ScrollText, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const employeeItems = [
  { label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Jobs', icon: Briefcase, path: '/jobs' },
  { label: 'Clock', icon: Clock, path: '/time-clock' },
  { label: 'Leave', icon: UmbrellaOff, path: '/leave' },
  { label: 'Chat', icon: MessageSquare, path: '/chat' },
];

// Admins land on the operational command floor, so their thumb bar reflects it.
const adminItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Billing', icon: CreditCard, path: '/billing' },
  { label: 'Audit', icon: ScrollText, path: '/audit-log' },
  { label: 'Settings', icon: SettingsIcon, path: '/settings' },
];

export default function MobileNav({ isAdmin }) {
  const location = useLocation();
  const items = isAdmin ? adminItems : employeeItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors min-w-[56px]',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}