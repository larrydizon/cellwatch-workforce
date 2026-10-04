import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2 } from 'lucide-react';
import useOrganization from '@/hooks/useOrganization';
import { isAdminUser } from '@/lib/employeeProfile';
import CompanyProfileForm from '@/components/company/CompanyProfileForm';

export default function CompanyProfile() {
  const { user } = useOutletContext();
  const orgState = useOrganization(user);

  const { data: levels = [] } = useQuery({
    queryKey: ['user-levels', user?.organization_id],
    queryFn: () => base44.entities.UserLevel.filter({ organization_id: user.organization_id }, 'created_date', 100),
    enabled: !!user?.organization_id,
  });

  const canEdit = isAdminUser(user, levels);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-heading flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" /> Company Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {canEdit
            ? 'Manage your company identity, branding and details'
            : 'Your company profile (view only)'}
        </p>
      </div>

      <CompanyProfileForm org={orgState.org} orgId={user?.organization_id} user={user} canEdit={canEdit} />
    </div>
  );
}