import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import { listDirectoryMembers } from '@/lib/employeeDirectory';

const statusColors = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  declined: "bg-red-50 text-red-700 border-red-200",
  change_requested: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-slate-50 text-slate-700 border-slate-200",
  cancelled: "bg-red-50 text-red-400 border-red-200",
};

export default function Schedule() {
  const [currentWeek, setCurrentWeek] = useState(moment().startOf('isoWeek'));
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', assigned_to: '', assigned_name: '', start_time: '', end_time: '',
    site_address: '', client_name: '', description: '', required_tools: '', safety_notes: ''
  });
  const queryClient = useQueryClient();

  // Get current user for role-based access
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });
  const isAdmin = ['admin', 'operations_manager', 'supervisor'].includes(currentUser?.role);

  const weekDays = Array.from({ length: 7 }, (_, i) => currentWeek.clone().add(i, 'days'));

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts', currentWeek.format(), currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      if (isAdmin) {
        return base44.entities.Shift.list('-start_time', 200);
      }
      return base44.entities.Shift.filter({ assigned_to: currentUser.email }, '-start_time', 200);
    },
    enabled: !!currentUser?.email,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['schedule-users'],
    queryFn: listDirectoryMembers,
  });

  // Only employees belonging to the current organization
  const orgUsers = users;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Shift.create({ ...data, status: 'scheduled', organization_id: currentUser?.organization_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setCreateOpen(false);
      setForm({ title: '', assigned_to: '', assigned_name: '', start_time: '', end_time: '', site_address: '', client_name: '', description: '', required_tools: '', safety_notes: '' });
      toast.success('Shift created');
    },
  });

  const getShiftsForDay = (day) => {
    return shifts.filter(s => moment(s.start_time).isSame(day, 'day'));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentWeek.format('D MMM')} – {currentWeek.clone().add(6, 'days').format('D MMM YYYY')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(w => w.clone().subtract(1, 'week'))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentWeek(moment().startOf('isoWeek'))}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(w => w.clone().add(1, 'week'))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {isAdmin && (
            <Button onClick={() => setCreateOpen(true)} className="gap-2 ml-2">
              <Plus className="h-4 w-4" /> Add Shift
            </Button>
          )}
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map(day => {
          const dayShifts = getShiftsForDay(day);
          const isToday = day.isSame(moment(), 'day');
          return (
            <div key={day.format()} className={`rounded-xl border ${isToday ? 'border-primary bg-primary/5' : 'border-border bg-card'} min-h-[140px]`}>
              <div className={`px-3 py-2 border-b ${isToday ? 'border-primary/20' : 'border-border'}`}>
                <p className="text-xs text-muted-foreground">{day.format('ddd')}</p>
                <p className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>{day.format('D')}</p>
              </div>
              <div className="p-2 space-y-2">
                {dayShifts.map(shift => (
                  <div key={shift.id} className="p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer">
                    <p className="text-xs font-semibold truncate">{shift.title}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      <span>{moment(shift.start_time).format('h:mm A')}</span>
                    </div>
                    {shift.assigned_name && (
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                        <User className="h-2.5 w-2.5" />
                        <span className="truncate">{shift.assigned_name}</span>
                      </div>
                    )}
                    <Badge variant="outline" className={`mt-1 text-[9px] py-0 px-1.5 ${statusColors[shift.status] || ''}`}>
                      {shift.status}
                    </Badge>
                  </div>
                ))}
                {dayShifts.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/50 text-center py-4">No shifts</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Shift Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Shift Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Morning shift – Queen St" />
            </div>
            <div className="space-y-2">
              <Label>Assign To *</Label>
              <Select value={form.assigned_to} onValueChange={v => {
                const u = users.find(u => u.email === v);
                setForm({ ...form, assigned_to: v, assigned_name: u?.full_name || '' });
              }}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {orgUsers.map(u => (
                    <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Site Address</Label>
              <Input value={form.site_address} onChange={e => setForm({ ...form, site_address: e.target.value })} placeholder="Address" />
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="Client name" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.assigned_to || !form.start_time || !form.end_time || createMutation.isPending}>
              Create Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
