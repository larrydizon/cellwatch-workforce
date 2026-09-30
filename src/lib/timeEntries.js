import { base44 } from '@/api/base44Client';

/**
 * All time-entry writes go through a server-side command handler. The browser
 * may request an action, but it never decides ownership, approval state, paid
 * hours, or the acting employee identity.
 */
export async function runTimeEntryCommand(action, payload = {}) {
  const response = await base44.functions.invoke('timeEntryCommand', { action, ...payload });
  return response?.data?.entry ?? response?.data ?? response;
}
