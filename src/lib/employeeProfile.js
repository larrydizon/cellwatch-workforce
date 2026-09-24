// Shared employee profile options and payload helpers

export const USER_LEVELS = [
  { value: 'admin', label: 'Administrator' },
  { value: 'operations_manager', label: 'Operations Manager' },
  { value: 'supervisor', label: 'Supervisor / Team Leader' },
  { value: 'technician', label: 'Field Technician' },
  { value: 'casual_worker', label: 'Casual / Subcontractor' },
  { value: 'client_viewer', label: 'Client Viewer' },
];

export const CONTRACT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'casual', label: 'Casual' },
  { value: 'fixed_term', label: 'Fixed Term' },
  { value: 'contractor', label: 'Contractor / Subcontractor' },
];

export function levelLabel(role) {
  return USER_LEVELS.find(l => l.value === role)?.label || role || 'User';
}

export function buildProfileForm(user) {
  return {
    phone: user?.phone || '',
    address: user?.address || '',
    position: user?.position || '',
    job_title: user?.job_title || '',
    team: user?.team || '',
    skillsText: (user?.skills || []).join(', '),
    ird_number: user?.ird_number || '',
    contract_type: user?.contract_type || '',
    hourly_rate: user?.hourly_rate ?? '',
    overtime_multiplier: user?.overtime_multiplier ?? 1.5,
    emergency_contact_name: user?.emergency_contact_name || '',
    emergency_contact_phone: user?.emergency_contact_phone || '',
    emergency_contact_relationship: user?.emergency_contact_relationship || '',
    photos: user?.photos || [],
    role: user?.role || 'user',
  };
}

export function buildProfilePayload(form, includeAdminFields) {
  const payload = {
    phone: form.phone,
    address: form.address,
    position: form.position,
    job_title: form.job_title,
    team: form.team,
    skills: form.skillsText.split(',').map(s => s.trim()).filter(Boolean),
    emergency_contact_name: form.emergency_contact_name,
    emergency_contact_phone: form.emergency_contact_phone,
    emergency_contact_relationship: form.emergency_contact_relationship,
    photos: form.photos,
  };

  if (includeAdminFields) {
    payload.ird_number = form.ird_number;
    payload.contract_type = form.contract_type || undefined;
    payload.hourly_rate = form.hourly_rate === '' ? undefined : Number(form.hourly_rate);
    payload.overtime_multiplier = form.overtime_multiplier === '' ? undefined : Number(form.overtime_multiplier);
  }

  return payload;
}