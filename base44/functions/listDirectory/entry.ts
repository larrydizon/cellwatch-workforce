import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

function listItems(value: any): any[] {
  return Array.isArray(value) ? value : value?.items || [];
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user: any = await base44.auth.me().catch(() => null);
    if (!user?.email || !user?.organization_id) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const records = listItems(await base44.asServiceRole.entities.Employee.filter({
      organization_id: user.organization_id,
    }, 'full_name', 500));
    const members = records.filter((record: any) => record.is_active !== false).map((record: any) => ({
      id: record.id,
      email: record.email,
      full_name: record.full_name || record.email,
      job_title: record.job_title || record.position || '',
      team: record.team || '',
    }));
    return Response.json({ members });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'Request failed' }, { status: 500 });
  }
}
