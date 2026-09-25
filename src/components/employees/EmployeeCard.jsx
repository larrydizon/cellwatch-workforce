import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, ClipboardList, LayoutDashboard, Briefcase, User as UserIcon, Trash2 } from 'lucide-react';
import { userLevelLabel } from '@/lib/employeeProfile';
import { roleBadgeColors, empTypeLabels } from '@/lib/employeeDisplay';

export default function EmployeeCard({ emp, levels, isAdmin, onDashboard, onProfile, onForms, onAssignJob, onRemove }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {emp.photos?.[0] ? (
            <img src={emp.photos[0]} alt={emp.full_name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-primary font-semibold text-sm">
              {emp.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{emp.full_name || 'Unknown'}</p>
          <p className="text-xs text-muted-foreground truncate">{emp.job_title || 'No title set'}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={roleBadgeColors[emp.role] || ""}>
              {userLevelLabel(emp, levels)}
            </Badge>
            {emp.employment_type && (
              <Badge variant="outline" className="text-xs">
                {empTypeLabels[emp.employment_type] || emp.employment_type}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-border space-y-1.5">
        {emp.email && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" /> <span className="truncate">{emp.email}</span>
          </div>
        )}
        {emp.phone && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" /> {emp.phone}
          </div>
        )}
        {emp.team && (
          <p className="text-xs text-muted-foreground">Team: {emp.team}</p>
        )}
      </div>
      {emp.email && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button variant="default" size="sm" className="gap-1.5" onClick={() => onDashboard(emp)}>
            <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onProfile(emp)}>
            <UserIcon className="h-3.5 w-3.5" /> Profile
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onForms(emp)}>
            <ClipboardList className="h-3.5 w-3.5" /> Forms
          </Button>
          <Button variant="outline" size="sm" className="col-span-2 gap-1.5" onClick={() => onAssignJob(emp)}>
            <Briefcase className="h-3.5 w-3.5" /> Assign Job
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="col-span-2 gap-1.5 text-destructive hover:text-destructive"
              onClick={() => onRemove(emp)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove Employee
            </Button>
          )}
        </div>
      )}
    </div>
  );
}