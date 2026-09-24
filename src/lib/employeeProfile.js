// Shared employee profile options and payload helpers

// Levels every organization starts with — admins can add, rename or remove these
export const DEFAULT_LEVELS = [
  { label: 'Administrator', value: 'administrator', is_admin: true },
  { label: 'Operations Manager', value: 'operations_manager', is_admin: true },
  { label: 'Supervisor', value: 'supervisor', is_admin: true },
  { label: 'Office Manager', value: 'office_manager', is_admin: false },
  { label: 'Office Worker', value: 'office_worker', is_admin: false },
  { label: 'Field Technician', value: 'technician', is_admin: false },
  { label: 'Casual / Subcontractor', value: 'casual_worker', is_admin: false },
  { label: 'Client Viewer', value: 'client_viewer', is_admin: false },
  { label: 'Standard User', value: 'standard_user', is_admin: false },
];

// Fallback names for records saved before user levels were configurable
const LEGACY_LEVEL_LABELS = {
  admin: 'Administrator',
  user: 'Standard User',
  operations_manager: 'Operations Manager',
  supervisor: 'Supervisor',
  technician: 'Field Technician',
  casual_worker: 'Casual / Subcontractor',
  client_viewer: 'Client Viewer',
};

export function userLevelLabel(user, levels = []) {
  if (!user) return '';
  const level = levels.find(l => l.value === user.user_level);
  if (level) return level.label;
  return LEGACY_LEVEL_LABELS[user.user_level] || LEGACY_LEVEL_LABELS[user.role] || user.role || 'User';
}

export const CONTRACT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'casual', label: 'Casual' },
  { value: 'fixed_term', label: 'Fixed Term' },
  { value: 'contractor', label: 'Contractor / Subcontractor' },
];

export const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
];

export function slugify(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'field';
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
    customFields: user?.custom_fields || {},
    user_level: user?.user_level || '',
    role: user?.role || 'user',
  };
}

export function buildProfilePayload(form, { userLevel = false, pay = false } = {}) {
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
    custom_fields: form.customFields,
  };

  if (userLevel) {
    payload.user_level = form.user_level;
  }

  if (pay) {
    payload.ird_number = form.ird_number;
    payload.contract_type = form.contract_type || undefined;
    payload.hourly_rate = form.hourly_rate === '' ? undefined : Number(form.hourly_rate);
    payload.overtime_multiplier = form.overtime_multiplier === '' ? undefined : Number(form.overtime_multiplier);
  }

  return payload;
}