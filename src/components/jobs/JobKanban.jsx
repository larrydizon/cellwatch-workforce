import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import JobKanbanCard from './JobKanbanCard';

const COLUMNS = [
  { value: 'new', label: 'New', accent: 'bg-blue-500' },
  { value: 'scheduled', label: 'Scheduled', accent: 'bg-violet-500' },
  { value: 'in_progress', label: 'In Progress', accent: 'bg-amber-500' },
  { value: 'waiting', label: 'Waiting', accent: 'bg-orange-500' },
  { value: 'completed', label: 'Completed', accent: 'bg-emerald-500' },
  { value: 'invoiced', label: 'Invoiced', accent: 'bg-slate-500' },
  { value: 'cancelled', label: 'Cancelled', accent: 'bg-red-500' },
];

export default function JobKanban({ jobs, onStatusChange, draggable, onSelect }) {
  const handleDragEnd = ({ destination, draggableId }) => {
    if (!destination) return;
    const job = jobs.find(j => j.id === draggableId);
    if (!job || job.status === destination.droppableId) return;
    onStatusChange(job.id, destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colJobs = jobs.filter(j => j.status === col.value);
          return (
            <div key={col.value} className="flex-shrink-0 w-72">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`h-2.5 w-2.5 rounded-full ${col.accent}`} />
                <h3 className="font-semibold text-sm">{col.label}</h3>
                <span className="text-xs text-muted-foreground ml-auto">{colJobs.length}</span>
              </div>
              <Droppable droppableId={col.value} isDropDisabled={!draggable}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[140px] rounded-xl p-2 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-primary/5 ring-1 ring-primary/30' : 'bg-muted/40'
                    }`}
                  >
                    {colJobs.map((job, index) => (
                      <Draggable key={job.id} draggableId={job.id} index={index} isDragDisabled={!draggable}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={dragSnapshot.isDragging ? 'rotate-1' : ''}
                          >
                            <JobKanbanCard job={job} onClick={() => onSelect?.(job)} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}