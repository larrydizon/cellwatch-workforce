import { base44 } from '@/api/base44Client';

export async function runOrganizationCommand(action, payload = {}) {
  const response = await base44.functions.invoke('organizationCommand', { action, ...payload });
  return response?.data?.organization ?? response?.data ?? response;
}
