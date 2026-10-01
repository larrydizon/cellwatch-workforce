import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  effectiveRole,
  isPlatformOwner,
  platformOwnerConfigured,
  PLATFORM_OWNER_ROLE,
} from '../../shared/platformOwner.ts';

// Reports whether the signed-in account is recognised as the Cellwatch platform
// owner. Used to confirm the owner allowlist is set up correctly.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user: any = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Authentication required' }, { status: 401 });

    return Response.json({
      email: user.email,
      role: effectiveRole(user),
      owner_role: PLATFORM_OWNER_ROLE,
      is_platform_owner: isPlatformOwner(user),
      owner_configured: platformOwnerConfigured(),
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'Request failed' }, { status: 500 });
  }
}