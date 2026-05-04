import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, MapPin, Users, Clock, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

const statusColors = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  scheduled: "bg-violet-50 text-violet-700 border-violet-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  waiting: "bg-orange-50 text-orange-700 border-orange-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  invoiced: "bg-slate-50 text-slate-700 border-slate-200",
};

const priorityColors = {
  low: "bg-slate-50 text-slate-600",
  medium: "bg-blue-50 text-blue-600",
  high: "bg-orange-50 text-orange-600",
  urgent: "bg-red-50 text-red-600",
};

export default function Jobs() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', client_name: '', site_address: '', scope_of_work: '', priority: 'medium', status: 'new', job_type: 'other', estimated_hours: '' });
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.create({
      ...data,
      job_number: `CW-${Date.now().toString(36).toUpperCase()}`,
      estimated_hours: data.estimated_hours ? Number(data.estimated_hours) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setCreateOpen(false);
      setForm({ title: '', client_name: '', site_address: '', scope_of_work: '', priority: 'medium', status: 'new', job_type: 'other', estimated_hours: '' });
      toast.success('Job created');
    },
  });

  const filtered = jobs.filter(j => {
    const matchSearch = j.title?.toLowerCase().includes(search.toLowerCase()) ||
      j.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      j.job_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">{jobs.length} total jobs</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Job
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="h-10 overflow-x-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="in_progress">Active</TabsTrigger>
            <TabsTrigger value="completed">Done</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {filtered.map(job => (
          <div key={job.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">{job.job_number}</span>
                  <Badge variant="outline" className={priorityColors[job.priority]}>
                    {job.priority}
                  </Badge>
                  <Badge variant="outline" className={statusColors[job.status]}>
                    {job.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <h3 className="font-semibold mt-1.5">{job.title}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  {job.client_name && (
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{job.client_name}</span>
                  )}
                  {job.site_address && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.site_address}</span>
                  )}
                  {job.estimated_hours && (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.estimated_hours}h est.</span>
                  )}
                  {job.assigned_workers?.length > 0 && (
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.assigned_workers.length} assigned</span>
                  )}
                </div>
              </div>
            </div>
            {job.scope_of_work && (
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{job.scope_of_work}</p>
            )}
          </div>
        ))}
        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No jobs found</p>
            <p className="text-sm mt-1">Create your first job to get started</p>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Job Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Fibre Installation – 42 Queen St" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Client name" />
              </div>
              <div className="space-y-2">
                <Label>Job Type</Label>
                <Select value={form.job_type} onValueChange={(v) => setForm({ ...form, job_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fibre">Fibre</SelectItem>
                    <SelectItem value="cctv">CCTV</SelectItem>
                    <SelectItem value="cabling">Cabling</SelectItem>
                    <SelectItem value="telecom">Telecom</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Site Address</Label>
              <Input value={form.site_address} onChange={(e) => setForm({ ...form, site_address: e.target.value })} placeholder="Full site address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Est. Hours</Label>
                <Input type="number" value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Scope of Work</Label>
              <Textarea value={form.scope_of_work} onChange={(e) => setForm({ ...form, scope_of_work: e.target.value })} placeholder="Describe the work..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || createMutation.isPending}>
              Create Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}