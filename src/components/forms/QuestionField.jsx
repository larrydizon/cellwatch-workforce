import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function QuestionField({ question, value, onChange }) {
  const { type, options = [] } = question;

  if (type === 'yes_no') {
    return (
      <div className="flex gap-3">
        {['Yes', 'No'].map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
              value === opt
                ? opt === 'Yes'
                  ? 'border-success bg-success/10 text-success'
                  : 'border-destructive bg-destructive/10 text-destructive'
                : 'border-border hover:border-primary/40'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (type === 'checkbox') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={e => {
                const next = e.target.checked ? [...selected, opt] : selected.filter(x => x !== opt);
                onChange(next);
              }}
              className="rounded"
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  if (type === 'select') {
    return (
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Select an option..." /></SelectTrigger>
        <SelectContent>
          {options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  if (type === 'textarea') {
    return <Textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Your answer..." className="h-24" />;
  }

  if (type === 'number') {
    return <Input type="number" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Enter a number" />;
  }

  if (type === 'signature') {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">By typing your name below, you acknowledge the above statement.</p>
        <Input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Type your full name to sign" />
      </div>
    );
  }

  return <Input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Your answer..." />;
}