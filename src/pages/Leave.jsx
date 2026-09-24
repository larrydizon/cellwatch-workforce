import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Calendar, Check, X, FileText } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';

const leaveTypeLabels = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  bereavement: 'Bereavement Leave',
  unpaid: 'Unpaid Leave',
  other: 'Other',
};

const statusBadge = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  declined: 'bg-red-50 text-red-700 border-red-200',
};

export default function Leave() {
  const { user } = useOutletContext();
  const queryClient = useQueryClient();
  const [applyOpen, setApplyOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [form, setForm] = useState({
    leave_type: 'annual', start_date: '', end_date: '', reason: '',
  });

  const isAdmin = ['admin', 'operations_manager', 'supervisor'].includes(user?.role);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['leave-requests', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      if (isAdmin) {
        return base44.entities.LeaveRequest.list('-created_date', 100);
      }
      return base44.entities.LeaveRequest.filter({ employee_email: user.email }, '-created_date', 50);
    },
    enabled: !!user?.email,
  });

  const applyMutation = useMutation({
    mutationFn: () => {
      const start = moment(form.start_date);
      const end = moment(form.end_date);
      const days = end.diff(start, 'days') + 1;
      return base44.entities.LeaveRequest.create({
        ...form,
        organization_id: user.organization_id,
        employee_email: user.email,
        employee_name: user.full_name,
        days_requested: days,
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      setApplyOpen(false);
      setForm({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
      toast.success('Leave request submitted');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }) =>
      base44.entities.LeaveRequest.update(id, {
        status,
        admin_notes: adminNotes,
        reviewed_by: user.email,
        reviewed_at: new Date().toISOString(),
      }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      setReviewOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
      toast.success(`Leave request ${status}`);
    },
  });

  const openReview = (req) => {
    setSelectedRequest(req);
    setAdminNotes(req.admin_notes || '');
    setReviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? `${requests.length} total requests` : 'Manage your leave applications'}
          </p>
        </div>
        {!isAdmin && (
          <Button onClick={() => setApplyOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Apply for Leave
          </Button>
        )}
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {requests.map(req => (
          <div key={req.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  {isAdmin && (
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">{req.employee_name || req.employee_email}</p>
                  )}
                  <p className="text-sm font-semibold">{leaveTypeLabels[req.leave_type]}</p>
                  <p className="text-sm text-muted-foreground">
                    {moment(req.start_date).format('D MMM')} – {moment(req.end_date).format('D MMM YYYY')}
                    <span className="ml-2 text-xs">({req.days_requested} day{req.days_requested !== 1 ? 's' : ''})</span>
                  </p>
                  {req.reason && <p className="text-xs text-muted-foreground mt-1 italic">"{req.reason}"</p>}
                  {req.admin_notes && req.status !== 'pending' && (
                    <p className="text-xs text-muted-foreground mt-1">Admin note: {req.admin_notes}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-12 sm:ml-0">
                <Badge variant="outline" className={statusBadge[req.status]}>
                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </Badge>
                {isAdmin && req.status === 'pending' && (
                  <Button size="sm" variant="outline" onClick={() => openReview(req)}>
                    Review
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {requests.length === 0 && !isLoading && (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No leave requests</p>
            {!isAdmin && <p className="text-sm mt-1">Use "Apply for Leave" to submit a request</p>}
          </div>
        )}
      </div>

      {/* Apply Dialog (employees only) */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Leave Type *</Label>
              <Select value={form.leave_type} onValueChange={v => setForm({ ...form, leave_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(leaveTypeLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3} placeholder="Briefly describe the reason..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button
              onClick={() => applyMutation.mutate()}
              disabled={!form.start_date || !form.end_date || applyMutation.isPending}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog (admins only) */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Leave Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-2">
              <div className="bg-muted rounded-lg p-4 space-y-1">
                <p className="font-semibold">{selectedRequest.employee_name}</p>
                <p className="text-sm text-muted-foreground">{leaveTypeLabels[selectedRequest.leave_type]}</p>
                <p className="text-sm text-muted-foreground">
                  {moment(selectedRequest.start_date).format('D MMM')} – {moment(selectedRequest.end_date).format('D MMM YYYY')} ({selectedRequest.days_requested} days)
                </p>
                {selectedRequest.reason && <p className="text-sm italic mt-2">"{selectedRequest.reason}"</p>}
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} placeholder="Add a note for the employee..." />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => reviewMutation.mutate({ id: selectedRequest.id, status: 'declined' })}
              disabled={reviewMutation.isPending}
              className="gap-2"
            >
              <X className="h-4 w-4" /> Decline
            </Button>
            <Button
              onClick={() => reviewMutation.mutate({ id: selectedRequest.id, status: 'approved' })}
              disabled={reviewMutation.isPending}
              className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
            >
              <Check className="h-4 w-4" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}