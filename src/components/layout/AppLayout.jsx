import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import TopBar from './TopBar';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { isAdminUser } from '@/lib/employeeProfile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Briefcase, Clock,
  FileText, MessageSquare, Settings, Bell, UmbrellaOff, LayoutGrid, ClipboardList, CreditCard, User as UserIcon, MapPin
} from 'lucide-react';
import useShiftReminders from '@/hooks/useShiftReminders';
import useAutoClockOut from '@/hooks/useAutoClockOut';
import useOvertimePrompt from '@/hooks/useOvertimePrompt';
import OvertimePromptModal from '@/components/timeclock/OvertimePromptModal';
import PlanStatusBanner from '@/components/billing/PlanStatusBanner';
import useOrganization from '@/hooks/useOrganization';
import useLiveNotifications from '@/hooks/useLiveNotifications';
import { LocationConsentProvider } from '@/lib/LocationConsentContext';
import LocationConsentNotice from '@/components/timeclock/LocationConsentNotice';
import PresenceConsentNotice from '@/components/timeclock/PresenceConsentNotice';
import CompanyLogo from './CompanyLogo';

const mobileNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Admin View', icon: LayoutGrid, path: '/admin-overview', adminOnly: true },
  { label: 'Employees', icon: Users, path: '/employees', ownerOnly: true },
  { label: 'My Profile', icon: UserIcon, path: '/profile' },
  { label: 'Schedule', icon: Calendar, path: '/schedule' },
  { label: 'Jobs', icon: Briefcase, path: '/jobs' },
  { label: 'Time Clock', icon: Clock, path: '/time-clock' },
  { label: 'Location History', icon: MapPin, path: '/location-history' },
  { label: 'Timesheets', icon: FileText, path: '/timesheets' },
  { label: 'Leave', icon: UmbrellaOff, path: '/leave' },
  { label: 'Forms', icon: ClipboardList, path: '/forms', adminOnly: true },
  { label: 'My Forms', icon: ClipboardList, path: '/my-forms' },
  { label: 'Chat', icon: MessageSquare, path: '/chat' },
  { label: 'Notifications', icon: Bell, path: '/notifications' },
  { label: 'Billing', icon: CreditCard, path: '/billing' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Self-serve: users without an organization are sent to onboarding
  useEffect(() => {
    if (user && !user.organization_id) {
      navigate('/onboarding', { replace: true });
    }
  }, [user]);

  useShiftReminders(user);
  useAutoClockOut(user);
  useLiveNotifications(user);
  const overtimeEntry = useOvertimePrompt(user);

  const queryClient = useQueryClient();

  const { data: levels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ['user-levels', user?.organization_id],
    queryFn: () => base44.entities.UserLevel.filter({ organization_id: user.organization_id }, 'created_date', 100),
    enabled: !!user?.organization_id,
  });

  const isAdmin = isAdminUser(user, levels);
  const orgState = useOrganization(user);

  // A workspace owner whose workspace predates administrator bootstrap is
  // promoted on their next visit, restoring the admin menu and Employees tab.
  useEffect(() => {
    const owner = orgState.org?.owner_email?.toLowerCase();
    if (!user?.email || !user.organization_id || levelsLoading || isAdmin) return;
    if (!owner || owner !== user.email.toLowerCase()) return;
    let cancelled = false;
    base44.functions
      .invoke('organizationCommand', { action: 'ensure_owner_admin' })
      .then((response) => {
        if (cancelled || !response?.data?.promoted) return;
        queryClient.invalidateQueries({ queryKey: ['user-levels'] });
        return base44.auth.me().then(setUser);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.email, user?.organization_id, levelsLoading, isAdmin, orgState.org?.owner_email]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} user={user} isAdmin={isAdmin} org={orgState.org} />

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
          <div className="flex items-center h-16 px-4 border-b border-sidebar-border gap-3">
            <CompanyLogo org={orgState.org} className="h-8 w-8" textClassName="text-sm" />
            <div className="min-w-0">
              <p className="font-bold text-sm text-sidebar-foreground truncate">{orgState.org?.name || 'My Company'}</p>
              <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">Workspace</p>
            </div>
          </div>
          <nav className="py-4 px-2 space-y-1">
            {mobileNavItems.filter(item =>
              (!item.adminOnly || ['admin', 'operations_manager', 'supervisor'].includes(user?.role)) &&
              (!item.ownerOnly || isAdmin)
            ).map((item) => {
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
        collapsed ? "md:ml-[64px]" : "md:ml-[240px]"
      )}>
        <TopBar user={user} onMobileMenuOpen={() => setMobileOpen(true)} org={orgState.org} />
        <main className="p-4 md:p-6 pb-24 md:pb-6 min-h-[calc(100vh-4rem)]">
          {isAdmin && <PlanStatusBanner orgState={orgState} />}
          <LocationConsentProvider user={user}>
            <Outlet context={{ user }} />
            <LocationConsentNotice />
            <PresenceConsentNotice />
          </LocationConsentProvider>
        </main>
      </div>

      <MobileNav isAdmin={isAdmin} />

      <OvertimePromptModal entry={overtimeEntry} />
    </div>
  );
}