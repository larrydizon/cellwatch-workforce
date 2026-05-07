import React, { useState } from 'react';
import moment from 'moment';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SHIFT_COLORS = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  declined: "bg-red-100 text-red-700 border-red-200",
  change_requested: "bg-amber-100 text-amber-800 border-amber-200",
  cancelled: "bg-red-50 text-red-400 border-red-100",
};

const LEAVE_COLORS = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-violet-100 text-violet-800 border-violet-200",
  declined: "bg-red-50 text-red-400 border-red-100",
};

export default function AdminCalendar({ shifts = [], leaveRequests = [] }) {
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month'));
  const [selectedDay, setSelectedDay] = useState(null);

  const startOfGrid = currentMonth.clone().startOf('isoWeek');
  const endOfGrid = currentMonth.clone().endOf('month').endOf('isoWeek');
  const days = [];
  let d = startOfGrid.clone();
  while (d.isSameOrBefore(endOfGrid, 'day')) {
    days.push(d.clone());
    d.add(1, 'day');
  }

  const getShiftsForDay = (day) =>
    shifts.filter(s => moment(s.start_time).isSame(day, 'day'));

  const getLeavesForDay = (day) =>
    leaveRequests.filter(l =>
      day.isSameOrAfter(moment(l.start_date), 'day') &&
      day.isSameOrBefore(moment(l.end_date), 'day')
    );

  const selectedShifts = selectedDay ? getShiftsForDay(selectedDay) : [];
  const selectedLeaves = selectedDay ? getLeavesForDay(selectedDay) : [];
  const hasSelected = selectedDay && (selectedShifts.length > 0 || selectedLeaves.length > 0);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Shared Calendar</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => m.clone().subtract(1, 'month'))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[120px] text-center">{currentMonth.format('MMMM YYYY')}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => m.clone().add(1, 'month'))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs ml-1" onClick={() => { setCurrentMonth(moment().startOf('month')); setSelectedDay(null); }}>
            Today
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 pt-3 pb-1 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-200 border border-blue-300 inline-block" />Shift</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-100 border border-amber-300 inline-block" />Leave (pending)</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-violet-100 border border-violet-300 inline-block" />Leave (approved)</span>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayShifts = getShiftsForDay(day);
          const dayLeaves = getLeavesForDay(day);
          const isToday = day.isSame(moment(), 'day');
          const isCurrentMonth = day.isSame(currentMonth, 'month');
          const isSelected = selectedDay && day.isSame(selectedDay, 'day');
          const total = dayShifts.length + dayLeaves.length;

          return (
            <div
              key={idx}
              onClick={() => setSelectedDay(isSelected ? null : day.clone())}
              className={`min-h-[72px] p-1.5 border-b border-r border-border cursor-pointer transition-colors
                ${isCurrentMonth ? 'bg-card hover:bg-muted/40' : 'bg-muted/20 hover:bg-muted/40'}
                ${isSelected ? 'ring-2 ring-inset ring-primary' : ''}
              `}
            >
              <div className={`text-xs font-medium mb-1 h-5 w-5 flex items-center justify-center rounded-full
                ${isToday ? 'bg-primary text-primary-foreground' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'}
              `}>
                {day.format('D')}
              </div>

              <div className="space-y-0.5">
                {dayShifts.slice(0, 2).map(s => (
                  <div key={s.id} className={`text-[10px] px-1 py-0.5 rounded border truncate font-medium ${SHIFT_COLORS[s.status] || SHIFT_COLORS.scheduled}`}>
                    {s.assigned_name || s.title}
                  </div>
                ))}
                {dayLeaves.slice(0, 2).map(l => (
                  <div key={l.id} className={`text-[10px] px-1 py-0.5 rounded border truncate font-medium ${LEAVE_COLORS[l.status] || LEAVE_COLORS.pending}`}>
                    {l.employee_name || l.employee_email} · leave
                  </div>
                ))}
                {total > 4 && (
                  <div className="text-[10px] text-muted-foreground px-1">+{total - 4} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div className="border-t border-border p-5">
          <h3 className="font-semibold text-sm mb-3">{selectedDay.format('dddd, D MMMM YYYY')}</h3>
          {!hasSelected && (
            <p className="text-sm text-muted-foreground">No shifts or leave requests on this day.</p>
          )}
          {selectedShifts.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Shifts ({selectedShifts.length})</p>
              <div className="space-y-2">
                {selectedShifts.map(s => (
                  <div key={s.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${SHIFT_COLORS[s.status] || SHIFT_COLORS.scheduled}`}>
                    <div>
                      <p className="font-medium">{s.title}</p>
                      <p className="text-xs opacity-80 mt-0.5">
                        {s.assigned_name} · {moment(s.start_time).format('h:mm A')} – {moment(s.end_time).format('h:mm A')}
                        {s.site_address ? ` · ${s.site_address}` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70 ml-3 flex-shrink-0">{s.status.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedLeaves.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Leave Requests ({selectedLeaves.length})</p>
              <div className="space-y-2">
                {selectedLeaves.map(l => (
                  <div key={l.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${LEAVE_COLORS[l.status] || LEAVE_COLORS.pending}`}>
                    <div>
                      <p className="font-medium">{l.employee_name || l.employee_email}</p>
                      <p className="text-xs opacity-80 mt-0.5">
                        {l.leave_type} leave · {moment(l.start_date).format('D MMM')} – {moment(l.end_date).format('D MMM')}
                        {l.days_requested ? ` · ${l.days_requested}d` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70 ml-3 flex-shrink-0">{l.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}