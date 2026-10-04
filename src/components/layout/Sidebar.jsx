import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Briefcase, Clock,
  FileText, MessageSquare, Settings, ChevronLeft, ChevronRight,
  ClipboardList, Bell, UmbrellaOff, LayoutGrid, CreditCard, DollarSign, User as UserIcon, ClipboardCheck, ScrollText, MapPin, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CompanyLogo from './CompanyLogo';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Admin View', icon: LayoutGrid, path: '/admin-overview', adminOnly: true },
  { label: 'Employees', icon: Users, path: '/employees', ownerOnly: true },
  { label: 'My Profile', icon: UserIcon, path: '/profile' },
  { label: 'Schedule', icon: Calendar, path: '/schedule' },
  { label: 'Jobs', icon: Briefcase, path: '/jobs' },
  { label: 'Time Clock', icon: Clock, path: '/time-clock' },
  { label: 'Location History', icon: MapPin, path: '/location-history' },
  { label: 'Timesheets', icon: FileText, path: '/timesheets' },
  { label: 'Daily Reports', icon: ClipboardCheck, path: '/daily-reports' },
  { label: 'Payroll', icon: DollarSign, path: '/payroll', adminOnly: true },
  { label: 'Leave', icon: UmbrellaOff, path: '/leave' },
  { label: 'Forms', icon: ClipboardList, path: '/forms', adminOnly: true },
  { label: 'My Forms', icon: ClipboardList, path: '/my-forms' },
  { label: 'Chat', icon: MessageSquare, path: '/chat' },
  { label: 'Notifications', icon: Bell, path: '/notifications' },
  { label: 'Billing', icon: CreditCard, path: '/billing' },
  { label: 'Audit Log', icon: ScrollText, path: '/audit-log', adminOnly: true },
  { label: 'Company Profile', icon: Building2, path: '/company-profile' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export default function Sidebar({ collapsed, onToggle, user, isAdmin, org }) {
  const location = useLocation();
  const hasAdminAccess = ['admin', 'operations_manager', 'supervisor'].includes(user?.role);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out",
        "bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
        collapsed ? "w-[64px]" : "w-[240px]",
        "hidden md:flex"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-sidebar-border",
        collapsed ? "justify-center" : "gap-3"
      )}>
        <CompanyLogo org={org} className="h-8 w-8" textClassName="text-sm" />
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm tracking-tight text-sidebar-foreground truncate">
              {org?.name || 'My Company'}
            </p>
            <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">Workspace</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.filter(item =>
          (!item.adminOnly || hasAdminAccess) && (!item.ownerOnly || isAdmin)
        ).map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}