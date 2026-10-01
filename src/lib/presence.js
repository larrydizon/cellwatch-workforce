import { base44 } from '@/api/base44Client';

/**
 * Presence checks are written by a server-side endpoint, never by the browser
 * directly. The server confirms the caller owns an open shift, is flagged as an
 * office / remote worker, has consented, and that the matching workspace switch
 * is on before anything is stored.
 */
export async function recordPresenceCheck(payload) {
  const response = await base44.functions.invoke('presenceCommand', {
    action: 'record',
    ...payload,
  });
  return response?.data?.check ?? null;
}

export async function signPresenceFiles(fileUris) {
  if (!fileUris?.length) return {};
  const response = await base44.functions.invoke('presenceCommand', {
    action: 'sign',
    file_uris: fileUris,
  });
  return response?.data?.urls || {};
}