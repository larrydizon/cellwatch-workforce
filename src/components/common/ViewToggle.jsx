import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

const VIEWS = [
  { id: 'grid', label: 'Card view', Icon: LayoutGrid },
  { id: 'list', label: 'List view', Icon: List },
];

export default function ViewToggle({ view, onChange }) {
  return (
    <div className="flex items-center rounded-lg border border-border p-0.5">
      {VIEWS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          aria-label={label}
          title={label}
          onClick={() => onChange(id)}
          className={cn(
            'rounded-md p-1.5 transition-colors',
            view === id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}