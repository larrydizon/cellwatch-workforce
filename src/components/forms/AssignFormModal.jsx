import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AssignFormModal({ open, onOpenChange, user }) {
  const queryClient = useQueryClient();
  const [formId, setFormId] = useState('');
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const { data: forms = [] } = useQuery({
    queryKey: ['form-templates'],
    queryFn: () => base44.entities.FormTemplate.filter({ is_active: true }, 'title', 200),
    enabled: open,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
    enabled: open,
  });

  // Only employees belonging to the current organization
  const orgUsers = users.filter(u => u.organization_id === user?.organization_id);

  useEffect(() => {
    if (open) { setFormId(''); setSelectedEmails([]); setDueDate(''); setNotes(''); }
  }, [open]);

  const assignMutation = useMutation({
    mutationFn: async () => {
      const form = forms.find(f => f.id === formId);
      const assignments = selectedEmails.map(email => {
        const u = users.find(x => x.email === email);
        return {
          organization_id: user.organization_id,
          form_template_id: form.id,
          form_title: form.title,
          form_type: form.form_type,
          employee_email: email,
          employee_name: u?.full_name || email,
          due_date: dueDate || undefined,
          status: 'pending',
          assigned_by: user.email,
          assigned_at: new Date().toISOString(),
          notes: notes || undefined,
        };
      });
      await base44.entities.FormAssignment.bulkCreate(assignments);
      await base44.entities.Notification.bulkCreate(selectedEmails.map(email => ({
        organization_id: user.organization_id,
        recipient_email: email,
        title: 'New form assigned',
        message: `"${form.title}" has been assigned to you${dueDate ? ` due ${dueDate}` : ''}.`,
        type: 'task_assigned',
        link: '/my-forms',
      })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`Form assigned to ${selectedEmails.length} employee(s)`);
      onOpenChange(false);
    },
  });

  const handleAssign = () => {
    if (!formId) { toast.error('Select a form'); return; }
    if (selectedEmails.length === 0) { toast.error('Select at least one employee'); return; }
    assignMutation.mutate();
  };

  const toggleEmail = (email) => {
    setSelectedEmails(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Form to Employees</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Form *</Label>
            <Select value={formId} onValueChange={setFormId}>
              <SelectTrigger><SelectValue placeholder="Select a form..." /></SelectTrigger>
              <SelectContent>
                {forms.map(f => <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Due Date (optional deadline)</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Assign to *</Label>
              <div className="flex gap-2">
                <button onClick={() => setSelectedEmails(orgUsers.map(u => u.email))} className="text-xs text-primary hover:underline">Select all</button>
                <button onClick={() => setSelectedEmails([])} className="text-xs text-muted-foreground hover:underline">Clear</button>
              </div>
            </div>
            <div className="border border-border rounded-lg max-h-52 overflow-y-auto divide-y divide-border">
              {orgUsers.map(u => (
                <label key={u.id} className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-muted/50">
                  <input type="checkbox" checked={selectedEmails.includes(u.email)} onChange={() => toggleEmail(u.email)} className="rounded" />
                  <span className="text-sm">{u.full_name || u.email}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{u.role || ''}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{selectedEmails.length} selected</p>
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea className="h-16" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instructions for employees..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={assignMutation.isPending}>
            {assignMutation.isPending ? 'Assigning...' : 'Assign Form'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}