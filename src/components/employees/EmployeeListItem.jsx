import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, ClipboardList, LayoutDashboard, Briefcase, User as UserIcon, Trash2 } from 'lucide-react';
import { userLevelLabel } from '@/lib/employeeProfile';
import { roleBadgeColors, empTypeLabels } from '@/lib/employeeDisplay';

export default function EmployeeListItem({ emp, levels, isAdmin, onDashboard, onProfile, onForms, onAssignJob, onRemove }) {
  return (
    <div className="bg-card rounded-xl border border-border p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {emp.photos?.[0] ? (
            <img src={emp.photos[0]} alt={emp.full_name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-primary font-semibold text-xs">
              {emp.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{emp.full_name || 'Unknown'}</p>
          <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:w-56 flex-wrap">
        <Badge variant="outline" className={roleBadgeColors[emp.role] || ""}>
          {userLevelLabel(emp, levels)}
        </Badge>
        {emp.employment_type && (
          <Badge variant="outline" className="text-xs">
            {empTypeLabels[emp.employment_type] || emp.employment_type}
          </Badge>
        )}
      </div>

      <div className="hidden xl:block w-40 text-xs text-muted-foreground truncate">
        {emp.job_title || 'No title set'}
      </div>

      <div className="hidden lg:flex w-40 items-center gap-2 text-xs text-muted-foreground truncate">
        {emp.phone ? <><Phone className="h-3 w-3" /> {emp.phone}</> : <span className="flex items-center gap-2"><Mail className="h-3 w-3" /> —</span>}
      </div>

      {emp.email && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onProfile(emp)}>
            <UserIcon className="h-3.5 w-3.5" /> Profile
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onForms(emp)}>
            <ClipboardList className="h-3.5 w-3.5" /> Forms
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onDashboard(emp)}>
            <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onAssignJob(emp)}>
            <Briefcase className="h-3.5 w-3.5" /> Assign Job
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onRemove(emp)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}