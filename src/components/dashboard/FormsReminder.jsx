import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ClipboardList, ChevronRight } from 'lucide-react';
import moment from 'moment';

export default function FormsReminder({ user }) {
  const { data: assignments = [] } = useQuery({
    queryKey: ['my-assignments', user?.email],
    queryFn: () => base44.entities.FormAssignment.filter({ employee_email: user.email, status: 'pending' }, '-assigned_at', 50),
    enabled: !!user?.email,
  });

  if (assignments.length === 0) return null;

  const overdue = assignments.filter(a => a.due_date && moment(a.due_date).isBefore(moment(), 'day'));

  return (
    <Link to="/my-forms" className="block bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
          <ClipboardList className="h-6 w-6 text-warning" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Forms to complete</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {assignments.length} form{assignments.length > 1 ? 's' : ''} assigned to you
            {overdue.length > 0 && <span className="text-destructive font-medium"> · {overdue.length} overdue</span>}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Link>
  );
}