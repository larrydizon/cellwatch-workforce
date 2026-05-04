import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import TopBar from './TopBar';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Briefcase, Clock,
  FileText, MessageSquare, Settings, Bell
} from 'lucide-react';

const mobileNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Employees', icon: Users, path: '/employees' },
  { label: 'Schedule', icon: Calendar, path: '/schedule' },
  { label: 'Jobs', icon: Briefcase, path: '/jobs' },
  { label: 'Time Clock', icon: Clock, path: '/time-clock' },
  { label: 'Timesheets', icon: FileText, path: '/timesheets' },
  { label: 'Chat', icon: MessageSquare, path: '/chat' },
  { label: 'Notifications', icon: Bell, path: '/notifications' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
          <div className="flex items-center h-16 px-4 border-b border-sidebar-border gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CW</span>
            </div>
            <div>
              <p className="font-bold text-sm text-sidebar-foreground">Cellwatch</p>
              <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">Workforce</p>
            </div>
          </div>
          <nav className="py-4 px-2 space-y-1">
            {mobileNavItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <div className={cn(
        "transition-all duration-300",
        collapsed ? "md:ml-[68px]" : "md:ml-[240px]"
      )}>
        <TopBar user={user} onMobileMenuOpen={() => setMobileOpen(true)} />
        <main className="p-4 md:p-6 pb-24 md:pb-6 min-h-[calc(100vh-4rem)]">
          <Outlet context={{ user }} />
        </main>
      </div>

      <MobileNav />
    </div>
  );
}