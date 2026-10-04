import React from 'react';
import CompanyProfileForm from '@/components/company/CompanyProfileForm';

// The company's profile inside Settings — the same editable sections as the
// dedicated Company Profile page, so both stay in step.
export default function CompanyCard({ org, orgId, user, canEdit }) {
  return <CompanyProfileForm org={org} orgId={orgId} user={user} canEdit={canEdit} />;
}