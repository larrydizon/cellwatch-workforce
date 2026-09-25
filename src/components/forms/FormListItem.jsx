import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Eye, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { typeLabels, typeColors } from '@/lib/formTypes';

export default function FormListItem({ form, onEdit, onResponses, onDelete, onToggleActive, onToggleClockIn }) {
  return (
    <div className="bg-card rounded-xl border border-border p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold truncate">{form.title}</p>
          <Badge variant="outline" className={typeColors[form.form_type] || typeColors.other}>
            {typeLabels[form.form_type] || 'Other'}
          </Badge>
        </div>
        {form.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{form.description}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-muted-foreground">
          <span>{form.questions?.length || 0} questions</span>
          <span>·</span>
          <span className={`font-medium ${form.is_active ? 'text-success' : 'text-muted-foreground'}`}>
            {form.is_active ? 'Active' : 'Inactive'}
          </span>
          {form.require_before_clockin && (
            <>
              <span>·</span>
              <span className="font-medium text-amber-600">Required at clock-in</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onToggleActive(form)}
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {form.is_active ? <ToggleRight className="h-4 w-4 text-success" /> : <ToggleLeft className="h-4 w-4" />}
          Active
        </button>
        <button
          onClick={() => onToggleClockIn(form)}
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {form.require_before_clockin ? <ToggleRight className="h-4 w-4 text-amber-500" /> : <ToggleLeft className="h-4 w-4" />}
          Clock-in
        </button>

        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onEdit(form)}>
          <Settings className="h-3.5 w-3.5" /> Edit
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onResponses(form)}>
          <Eye className="h-3.5 w-3.5" /> Responses
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
          onClick={() => onDelete(form)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}