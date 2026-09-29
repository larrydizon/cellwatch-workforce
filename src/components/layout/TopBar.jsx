import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import useLiveNotifications from '@/hooks/useLiveNotifications';

export default function TopBar({ user, onMobileMenuOpen }) {
  const { data: notifications = [] } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Notification.filter({ recipient_email: user.email, is_read: false }, '-created_date', 10);
    },
    enabled: !!user?.email,
  });

  useLiveNotifications(user);

  const unreadCount = notifications.length;

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={onMobileMenuOpen} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-accent">
          <Menu className="h-5 w-5" />
        </button>
        <div className="md:hidden flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">CW</span>
          </div>
          <span className="font-semibold text-sm">Cellwatch</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-accent transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <Link to="/profile" className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-xs">
              {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </span>
          </div>
          <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">{user?.full_name || 'User'}</span>
        </Link>
      </div>
    </header>
  );
}