import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, Clock, FileText, Megaphone, Check, CheckCheck } from 'lucide-react';
import moment from 'moment';
import { cn } from '@/lib/utils';

const typeIcons = {
  shift_assigned: Calendar,
  shift_changed: Calendar,
  timesheet_rejected: FileText,
  task_assigned: Clock,
  announcement: Megaphone,
  leave_approved: Check,
  leave_rejected: FileText,
  general: Bell,
};

export default function Notifications() {
  const { user } = useOutletContext();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => user?.email ? base44.entities.Notification.filter({ recipient_email: user.email }, '-created_date', 50) : [],
    enabled: !!user?.email,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()} className="gap-2">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map(notif => {
          const Icon = typeIcons[notif.type] || Bell;
          return (
            <div
              key={notif.id}
              onClick={() => !notif.is_read && markReadMutation.mutate(notif.id)}
              className={cn(
                "bg-card rounded-xl border border-border p-4 flex items-start gap-3 cursor-pointer transition-all hover:shadow-sm",
                !notif.is_read && "bg-primary/5 border-primary/20"
              )}
            >
              <div className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                !notif.is_read ? "bg-primary/10" : "bg-muted"
              )}>
                <Icon className={cn("h-4 w-4", !notif.is_read ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", !notif.is_read && "font-semibold")}>{notif.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1.5">{moment(notif.created_date).fromNow()}</p>
              </div>
              {!notif.is_read && (
                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
              )}
            </div>
          );
        })}
        {notifications.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">All caught up</p>
            <p className="text-sm mt-1">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}