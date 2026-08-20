import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function ManageTrainingModal({ open, onOpenChange, user, editingTraining }) {
  const queryClient = useQueryClient();
  const isAdmin = ['admin', 'operations_manager', 'supervisor'].includes(user?.role);
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('certificate');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
    enabled: isAdmin && open,
  });

  useEffect(() => {
    if (!open) return;
    if (editingTraining) {
      setEmployeeEmail(editingTraining.employee_email || '');
      setTitle(editingTraining.title || '');
      setType(editingTraining.type || 'certificate');
      setIssuer(editingTraining.issuer || '');
      setIssueDate(editingTraining.issue_date || '');
      setExpiryDate(editingTraining.expiry_date || '');
      setFileUrl(editingTraining.file_url || '');
      setNotes(editingTraining.notes || '');
    } else {
      setEmployeeEmail(user.email);
      setTitle(''); setType('certificate'); setIssuer('');
      setIssueDate(''); setExpiryDate(''); setFileUrl(''); setNotes('');
    }
  }, [open, editingTraining]);

  const saveMutation = useMutation({
    mutationFn: (data) => editingTraining
      ? base44.entities.Training.update(editingTraining.id, data)
      : base44.entities.Training.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trainings'] });
      queryClient.invalidateQueries({ queryKey: ['all-trainings'] });
      toast.success(editingTraining ? 'Record updated' : 'Record added');
      onOpenChange(false);
    },
  });

  const handleSave = () => {
    if (!title.trim()) { toast.error('Enter a title'); return; }
    if (!employeeEmail) { toast.error('Select an employee'); return; }
    const u = users.find(x => x.email === employeeEmail);
    saveMutation.mutate({
      employee_email: employeeEmail,
      employee_name: u?.full_name || employeeEmail,
      title, type,
      issuer: issuer || undefined,
      issue_date: issueDate || undefined,
      expiry_date: expiryDate || undefined,
      file_url: fileUrl || undefined,
      notes: notes || undefined,
      added_by: user.email,
    });
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(res.file_url);
      toast.success('File uploaded');
    } catch {
      toast.error('Upload failed');
    }
    setUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTraining ? 'Edit Record' : 'Add Certificate / Training'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {isAdmin ? (
            <div className="space-y-1.5">
              <Label>Employee *</Label>
              <Select value={employeeEmail} onValueChange={setEmployeeEmail}>
                <SelectTrigger><SelectValue placeholder="Select employee..." /></SelectTrigger>
                <SelectContent>
                  {users.map(u => <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Adding to your own records.</p>
          )}

          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input placeholder="e.g. First Aid Certificate" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="induction">Induction</SelectItem>
                  <SelectItem value="ticket">Ticket / Licence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Issuer / Provider</Label>
              <Input placeholder="e.g. Red Cross" value={issuer} onChange={e => setIssuer(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Issue Date</Label>
              <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Document (optional)</Label>
            {fileUrl ? (
              <div className="flex items-center gap-2">
                <a href={fileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">View uploaded file</a>
                <Button size="sm" variant="ghost" onClick={() => setFileUrl('')}>Remove</Button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg p-3 hover:bg-muted/50">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload'}</span>
                <input type="file" className="hidden" onChange={handleUpload} />
              </label>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea className="h-16" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}