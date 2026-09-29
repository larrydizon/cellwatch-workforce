import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Keeps notifications live: new records land in the badge and list without a refresh.
export default function useLiveNotifications(user) {
  const queryClient = useQueryClient();
  const email = user?.email;

  useEffect(() => {
    if (!email) return;
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      const record = event?.data;
      if (record?.recipient_email && record.recipient_email !== email) return;
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    });
    return unsubscribe;
  }, [email, queryClient]);
}