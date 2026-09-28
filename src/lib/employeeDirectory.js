// The platform only lets an app's owner read the built-in user list, so the
// employee directory is kept in the app's own Employee entity and kept in step
// with each profile whenever it is saved.
import { base44 } from '@/api/base44Client';
import { buildProfileForm } from './employeeProfile';

export function employeeRecordFromUser(user, organizationId) {
  if (!user?.email) return null;
  const form = buildProfileForm(user);
  return {
    organization_id: organizationId || user.organization_id,
    user_id: user.id,
    email: user.email,
    full_name: user.full_name || user.email,
    role: user.role || 'user',
    user_level: form.user_level,
    job_title: form.job_title,
    position: form.position,
    team: form.team,
    phone: form.phone,
    address: form.address,
    employment_type: user.employment_type || user.contract_type || '',
    contract_type: form.contract_type,
    ird_number: form.ird_number,
    hourly_rate: user.hourly_rate ?? undefined,
    overtime_multiplier: user.overtime_multiplier ?? undefined,
    skills: user.skills || [],
    emergency_contact_name: form.emergency_contact_name,
    emergency_contact_phone: form.emergency_contact_phone,
    emergency_contact_relationship: form.emergency_contact_relationship,
    photos: form.photos,
    custom_fields: form.customFields,
    daily_report_required: form.daily_report_required,
  };
}

// Create the directory entry if it is missing, otherwise update it in place
export async function upsertDirectoryRecord(organizationId, email, fields = {}) {
  if (!organizationId || !email) return null;
  const key = email.toLowerCase();

  const existing = await base44.entities.Employee.filter(
    { organization_id: organizationId, email: key },
    '-created_date',
    1
  );

  const payload = { organization_id: organizationId, email: key, ...fields };
  if (existing.length) {
    return base44.entities.Employee.update(existing[0].id, payload);
  }
  return base44.entities.Employee.create({ full_name: key, ...payload });
}

// userId: the linked user account id. Pass null for directory-only records
// (people who have been added but not signed up yet).
export async function syncEmployeeRecord(user, organizationId, userId) {
  const record = employeeRecordFromUser(user, organizationId);
  if (!record?.organization_id || !record.email) return null;
  const { organization_id, email, ...fields } = record;
  const accountId = userId === null ? null : (userId || user.id);
  if (accountId) {
    fields.user_id = accountId;
  } else {
    delete fields.user_id;
  }
  return upsertDirectoryRecord(organization_id, email, fields);
}