import { base44 } from '@/api/base44Client';

export async function submitFormResponse(payload) {
  const response = await base44.functions.invoke('submitForm', payload);
  return response?.data?.submission ?? response?.data ?? response;
}
