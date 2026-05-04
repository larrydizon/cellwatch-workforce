import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Clock, MessageSquare, UmbrellaOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileItems = [
  { label: 'Home', icon: LayoutDashboard, path: '/' },
  { label: 'Jobs', icon: Briefcase, path: '/jobs' },
  { label: 'Clock', icon: Clock, path: '/time-clock' },
  { label: 'Leave', icon: UmbrellaOff, path: '/leave' },
  { label: 'Chat', icon: MessageSquare, path: '/chat' },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors min-w-[56px]",
                isActive ? "text-primary" : "text-muted-foreground"
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