import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Clock, Download, FileText } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';

const statusBadge = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  pending_approval: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  adjustment_requested: "bg-violet-50 text-violet-700 border-violet-200",
};

export default function Timesheets() {
  const { user } = useOutletContext();
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  const isAdmin = ['admin', 'operations_manager', 'supervisor'].includes(user?.role);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['timesheets', filter],
    queryFn: async () => {
      if (filter === 'all') {
        return base44.entities.TimeEntry.list('-created_date', 100);
      }
      return base44.entities.TimeEntry.filter({ status: filter }, '-created_date', 100);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id) => base44.entities.TimeEntry.update(id, { status: 'approved', approved_by: user?.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      toast.success('Timesheet approved');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => base44.entities.TimeEntry.update(id, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      toast.success('Timesheet rejected');
    },
  });

  const exportCSV = () => {
    const headers = ['Employee', 'Date', 'Clock In', 'Clock Out', 'Hours', 'Break (min)', 'Job', 'Status', 'Overtime'];
    const rows = entries.map(e => [
      e.employee_name || e.employee_email,
      moment(e.clock_in).format('YYYY-MM-DD'),
      moment(e.clock_in).format('HH:mm'),
      e.clock_out ? moment(e.clock_out).format('HH:mm') : '',
      e.total_hours?.toFixed(2) || '',
      e.break_minutes || 0,
      e.job_title || '',
      e.status,
      e.is_overtime ? 'Yes' : 'No',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheets-${moment().format('YYYY-MM-DD')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const grouped = entries.reduce((acc, entry) => {
    const date = moment(entry.clock_in).format('YYYY-MM-DD');
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timesheets</h1>
          <p className="text-sm text-muted-foreground mt-1">{entries.length} entries</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending_approval">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-6">
        {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, dayEntries]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-sm">{moment(date).format('dddd, D MMMM YYYY')}</h3>
              <Badge variant="outline" className="text-xs">
                {dayEntries.reduce((s, e) => s + (e.total_hours || 0), 0).toFixed(1)}h total
              </Badge>
            </div>
            <div className="space-y-2">
              {dayEntries.map(entry => (
                <div key={entry.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-semibold text-xs">
                          {entry.employee_name?.split(' ').map(n => n[0]).join('') || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{entry.employee_name || entry.employee_email}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>{moment(entry.clock_in).format('h:mm A')} – {entry.clock_out ? moment(entry.clock_out).format('h:mm A') : 'Active'}</span>
                          {entry.job_title && <span>• {entry.job_title}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <p className="text-sm font-bold">{entry.total_hours ? `${entry.total_hours}h` : '—'}</p>
                        {entry.break_minutes > 0 && (
                          <p className="text-xs text-muted-foreground">{entry.break_minutes}m break</p>
                        )}
                      </div>
                      <Badge variant="outline" className={statusBadge[entry.status]}>
                        {entry.status?.replace(/_/g, ' ')}
                      </Badge>
                      {isAdmin && entry.status === 'pending_approval' && (
                        <div className="flex gap-1 ml-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-success hover:text-success hover:bg-success/10" onClick={() => approveMutation.mutate(entry.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => rejectMutation.mutate(entry.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {entry.is_overtime && (
                    <Badge className="mt-2 bg-amber-50 text-amber-700 border-amber-200" variant="outline">Overtime</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {entries.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No timesheets found</p>
          </div>
        )}
      </div>
    </div>
  );
}