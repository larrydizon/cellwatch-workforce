import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import TenantRow from '@/components/owner/TenantRow';
import ManageTenantDialog from '@/components/owner/ManageTenantDialog';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'trial', label: 'On trial' },
  { key: 'ending_soon', label: 'Ending soon' },
  { key: 'past_due', label: 'Past due' },
  { key: 'canceled', label: 'Canceled' },
];

export default function TenantTable({ tenants, loading, filter, onFilterChange, search, onSearchChange, onChanged }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((option) => (
            <Button
              key={option.key}
              size="sm"
              variant={filter === option.key ? 'default' : 'ghost'}
              className={cn('h-8', filter !== option.key && 'text-muted-foreground')}
              onClick={() => onFilterChange(option.key)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="Search name or owner email"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Workspace</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Plan</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Trial / period</th>
              <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Seats</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <TenantRow key={tenant.id} tenant={tenant} onManage={setSelected} />
            ))}
          </tbody>
        </table>
      </div>

      {!loading && tenants.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">No workspaces match this view.</p>
      )}
      {loading && <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading workspaces…</p>}

      <ManageTenantDialog tenant={selected} onOpenChange={(open) => !open && setSelected(null)} onDone={onChanged} />
    </div>
  );
}