// Canonical starter form library.
//
// Every new workspace is seeded with this curated set — one Pre-Start Checklist
// and one Health & Safety Inspection for each industry — so the Forms tab is
// useful from day one. This module is the single source of truth: edit it here
// and future workspaces receive the change. Seeding is idempotent (matched by
// title) so it is safe to run more than once.

type QTuple = [string, string?, string[]?];

export interface StarterForm {
  title: string;
  form_type: string;
  industry: string;
  description: string;
  questions: Array<{ id: string; label: string; type: string; required: boolean; options: string[] }>;
  require_before_clockin: boolean;
  frequency: string;
  is_active: boolean;
}

function materialize(tuples: QTuple[], prefix: string) {
  return tuples.map(([label, type = 'yes_no', options = []], index) => ({
    id: `${prefix}_q${index + 1}`,
    label,
    type,
    required: true,
    options,
  }));
}

// Shared across every industry — the same inspection is run regardless of trade.
const HS_QUESTIONS: QTuple[] = [
  ['Date of inspection', 'text'],
  ['Inspector name', 'text'],
  ['Site / location', 'text'],
  ['Areas inspected today', 'checkbox', [
    'Working at height',
    'Electrical hazards',
    'Traffic / vehicles',
    'Ladders / tools',
    'Manual lifting',
    'Slips, trips, falls',
    'Underground services',
    'Overhead power lines',
  ]],
  ['Is the site tidy and well-organised?'],
  ['Are walkways and access points clear?'],
  ['Are emergency exits clear and accessible?'],
  ['Is correct PPE worn by all workers?'],
  ['Has all equipment been inspected and tagged?'],
  ['Is the first aid kit stocked and accessible?'],
  ['Is safety signage in place and legible?'],
  ['Are hazardous substances stored correctly?'],
  ['Any incidents or near misses in this period?'],
  ['Hazards identified during inspection', 'textarea'],
  ['Corrective actions required', 'textarea'],
  ['Overall site rating', 'select', ['Excellent', 'Good', 'Satisfactory', 'Needs improvement', 'Poor']],
  ['Additional comments', 'textarea'],
  ['Inspector signature', 'signature'],
];

interface IndustryEntry {
  key: string;
  position: string;
  description: string;
  questions: QTuple[];
}

const INDUSTRIES: IndustryEntry[] = [
  {
    key: 'telecom',
    position: 'Telecom / Fibre Technician',
    description: "Daily Pre-Start H&S Checklist — New Zealand Telecom / Fibre Worksite. Complete before commencing work each day.",
    questions: [
      ['Briefly describe the work to be done today', 'textarea'],
      ['Are you fit and well to work today?'],
      ['Are you free from alcohol, drugs, or medication effects?'],
      ['Do you have any injury or issue that may affect your work?'],
      ["Tick any hazards present at today's site", 'checkbox', [
        'Working at height',
        'Electrical hazards',
        'Traffic / vehicles',
        'Ladders / tools',
        'Manual lifting',
        'Slips, trips, falls',
        'Weather conditions',
        'Public / customers nearby',
        'Underground services',
        'Overhead power lines',
        'Other',
      ]],
      ['Describe controls in place for identified hazards', 'textarea'],
      ['Do you have the correct PPE for the job? (hard hat, hi-vis, gloves, safety boots)'],
      ['Are tools and equipment safe to use?'],
      ['Are ladders, leads, and power tools checked?'],
      ['Do you know the emergency meeting point for this site?'],
      ['Is first aid kit available and accessible?'],
      ['Do you know who to contact in an emergency?'],
      ['Emergency contact name and number', 'text'],
      ['Do you understand you must stop work if it becomes unsafe?'],
      ['Have you raised any safety concerns before starting?'],
      ['Detail any safety concerns (if none, write N/A)', 'textarea'],
      ["I confirm I understand today's work, hazards, controls, and I will stop work if unsafe", 'signature'],
    ],
  },
  {
    key: 'roading',
    position: 'Roadworker',
    description: 'Daily Pre-Start H&S Checklist — New Zealand Roading & Highways Worksite. Complete before commencing work each day.',
    questions: [
      ['Describe the roading work to be completed today (e.g. pavement, drainage, kerbing)', 'textarea'],
      ['Are you fit and well to work today?'],
      ['Are you free from alcohol, drugs, or medication effects?'],
      ['Do you have any injury or fatigue issue that may affect your work?'],
      ['Has a Traffic Management Plan (TMP) been reviewed and is in place?'],
      ['Are all signs, cones, and barriers correctly placed per the TMP?'],
      ['Are all workers wearing hi-vis clothing visible to passing traffic?'],
      ['Has a traffic controller been briefed and positioned if required?'],
      ["Tick any hazards present at today's site", 'checkbox', [
        'Live traffic adjacent to works',
        'Plant / heavy machinery operating',
        'Overhead power lines',
        'Underground services (gas, water, fibre)',
        'Unstable ground / trenches',
        'Dust and airborne particles',
        'Hot bitumen / asphalt',
        'Manual lifting / repetitive strain',
        'Slips, trips, falls',
        'Weather / wind / rain',
        'Pedestrians / public nearby',
        'Other',
      ]],
      ['Controls in place for identified hazards', 'textarea'],
      ['Is correct PPE worn? (hi-vis, hard hat, safety boots, gloves, eye protection)'],
      ['Has plant and equipment been pre-started and inspected?'],
      ['Are reversing alarms and safety devices on all plant operational?'],
      ['Do you know the emergency assembly point for this site?'],
      ['Is first aid kit available and who is the trained first aider on site?', 'text'],
      ['Do you know the emergency services contact and site address to give them?'],
      ['Do you understand you must stop work if conditions become unsafe?'],
      ['Any safety concerns or near misses to report before starting?', 'textarea'],
      ["I confirm I understand today's work, hazards, controls, and I will stop work if unsafe", 'signature'],
    ],
  },
  {
    key: 'steel_fixing',
    position: 'Steel Fixer',
    description: 'Daily Pre-Start H&S Checklist — New Zealand Steel Fixing & Reinforcing Worksite. Complete before commencing work each day.',
    questions: [
      ['Describe the steel fixing work to be done today (e.g. footings, columns, slabs)', 'textarea'],
      ['Are you fit and well to work today?'],
      ['Are you free from alcohol, drugs, or medication effects?'],
      ['Do you have any injury, fatigue, or physical issue that may affect your work?'],
      ["Tick any hazards present at today's site", 'checkbox', [
        'Manual handling of heavy rebar / mesh',
        'Sharp edges on cut steel',
        'Working at height (elevated slabs, formwork)',
        'Overhead crane / lifting operations',
        'Protruding rebar (impalement risk)',
        'Slips, trips over rebar or ties',
        'Concrete pour activity nearby',
        'Electrical hazards near rebar',
        'Confined spaces',
        'Heat / sun exposure',
        'Other',
      ]],
      ['Controls in place for identified hazards', 'textarea'],
      ['Is correct PPE worn? (hard hat, hi-vis, steel-cap boots, gloves, cut-resistant gloves)'],
      ['Are protruding rebar ends capped or bent to prevent impalement?'],
      ['Are bar benders, tie guns, and cutting tools inspected and safe to use?'],
      ['Are lifting slings and lifting equipment tagged, rated, and inspected?'],
      ['If working on elevated formwork, is fall protection in place (guardrails, safety nets, harness)?'],
      ['Is the formwork and propping inspected and certified for loading?'],
      ['Have team lifts or mechanical aids been arranged for heavy bundles of rebar?'],
      ['Do you know the emergency assembly point for this site?'],
      ['Is first aid kit available and accessible?'],
      ['Do you know who to contact in an emergency?'],
      ['Do you understand you must stop work if conditions become unsafe?'],
      ['Any safety concerns or near misses to report before starting?', 'textarea'],
      ["I confirm I understand today's work, hazards, controls, and I will stop work if unsafe", 'signature'],
    ],
  },
  {
    key: 'construction',
    position: 'Construction Worker',
    description: 'Daily Pre-Start H&S Checklist — New Zealand Construction & Civil Worksite. Complete before commencing work each day.',
    questions: [
      ['Describe the construction work to be completed today', 'textarea'],
      ['Are you fit and well to work today?'],
      ['Are you free from alcohol, drugs, or medication effects?'],
      ['Do you have any injury or issue that may affect your work?'],
      ["Have you completed a site induction or been briefed on today's site rules?"],
      ["Have you reviewed the relevant SWMS / Job Safety Analysis for today's tasks?"],
      ["Tick any hazards present at today's site", 'checkbox', [
        'Working at height',
        'Excavation / trenching',
        'Plant and heavy machinery',
        'Electrical hazards',
        'Traffic / vehicles on site',
        'Overhead power lines',
        'Underground services',
        'Structural / formwork loading',
        'Manual lifting / repetitive strain',
        'Slips, trips, falls',
        'Dust / silica exposure',
        'Noise',
        'Weather conditions',
        'Public / pedestrians nearby',
        'Hazardous substances / chemicals',
        'Other',
      ]],
      ['Controls in place for identified hazards', 'textarea'],
      ['Is correct PPE worn? (hard hat, hi-vis, safety boots, gloves, eye protection)'],
      ['Are tools, plant, and equipment inspected and safe to use?'],
      ['Are exclusion zones and barricades correctly set up?'],
      ['If working at height — is fall protection in place (scaffolding, guardrails, or harness)?'],
      ['If excavating — has a ground-breaking permit been obtained and underground services located?'],
      ['Do you know the emergency assembly point for this site?'],
      ['Is first aid kit available and who is the trained first aider?', 'text'],
      ['Do you know the emergency contact number and site address?'],
      ['Do you understand you must stop work if it becomes unsafe?'],
      ['Any safety concerns or near misses to report before starting?', 'textarea'],
      ["I confirm I understand today's work, hazards, controls, and I will stop work if unsafe", 'signature'],
    ],
  },
  {
    key: 'electrical',
    position: 'Electrician',
    description: 'Daily Pre-Start H&S Checklist — Electrical & Utilities. Complete before commencing work.',
    questions: [
      ['Describe the electrical work to be completed today', 'textarea'],
      ['Are you fit and well to work today?'],
      ['Are you free from alcohol, drugs, or medication effects?'],
      ["Are you licensed and authorised for today's electrical work?"],
      ['Has lockout/tagout (LOTO) been applied to all isolated equipment?'],
      ['Have you tested with a voltage tester before commencing work?'],
      ['Is PPE serviceable? (insulated gloves, arc flash gear, safety glasses)'],
      ['Have you identified all underground cables and overhead services?'],
      ['Is a safety observer in place for high-risk tasks?'],
      ['Do you know the emergency assembly point and first aider on site?'],
      ['Do you understand you must stop work if conditions become unsafe?'],
      ['Any safety concerns or incidents to report?', 'textarea'],
      ['I declare I am fit for work and compliant with electrical safety regulations', 'signature'],
    ],
  },
  {
    key: 'transport',
    position: 'Driver / Transport Operator',
    description: 'Daily vehicle and driver pre-start check for transport and logistics.',
    questions: [
      ['Are you free from fatigue? (Have you had sufficient rest since last shift?)'],
      ['Are you free from alcohol, drugs, or medication effects?'],
      ['Do you hold a valid licence for the vehicle you will be operating today?'],
      ['Have you completed a walkaround vehicle inspection?'],
      ['Are tyres, lights, brakes, and mirrors in good working condition?'],
      ["Is the vehicle's load secured correctly?"],
      ["Are you familiar with today's route and any hazards?"],
      ['Do you have a charged mobile and emergency contact details?'],
      ['Vehicle condition', 'select', ['Good – no defects', 'Minor defect – reported', 'Major defect – not to be used']],
      ['Any vehicle damage or defects to report?', 'textarea'],
      ['I confirm I am fit to drive and the vehicle is roadworthy', 'signature'],
    ],
  },
  {
    key: 'mining',
    position: 'Mining Worker',
    description: 'Mining and resources site pre-start safety check.',
    questions: [
      ['Have you completed drug and alcohol testing as required?'],
      ['Are you free from fatigue and fit for your shift?'],
      ["Have you attended today's pre-shift toolbox talk?"],
      ['Is PPE serviceable? (hard hat, hi-vis, boots, gloves, ear and eye protection)'],
      ['Have you reviewed the take 5 or hazard ID for your work area?'],
      ['Is your equipment pre-start check completed and recorded?'],
      ['Are you aware of all exclusion zones and blast areas?'],
      ['Do you know the emergency muster point and evacuation procedure?'],
      ['Any hazards, near misses, or incidents to report?', 'textarea'],
      ["I acknowledge today's safety requirements and will comply with site rules", 'signature'],
    ],
  },
  {
    key: 'healthcare',
    position: 'Healthcare Worker',
    description: 'Healthcare and aged care worker daily pre-start and wellness check.',
    questions: [
      ['Are you feeling well and free from illness or symptoms today?'],
      ['Have you had adequate rest (minimum 8 hours) since your last shift?'],
      ['Are you up to date with required vaccinations and health clearances?'],
      ['Do you have access to all required PPE (gloves, mask, apron) for your shift?'],
      ['Have you reviewed any updated care plans or client notes?'],
      ['Are you aware of any infection control alerts or isolation requirements?'],
      ['Do you know the emergency and escalation procedures for your ward/site?'],
      ['Any incidents, medication errors, or concerns to report from your last shift?', 'textarea'],
      ['I confirm I am fit for duty and will comply with infection control protocols', 'signature'],
    ],
  },
  {
    key: 'hospitality',
    position: 'Hospitality Worker',
    description: 'Pre-shift check for hospitality and events staff.',
    questions: [
      ['Are you fit for work today and free from illness?'],
      ["Have you reviewed today's event or service schedule?"],
      ['Is your uniform complete and presentation standards met?'],
      ['Have you completed required food handling and hygiene checks?'],
      ['Are all kitchen/service areas clean and hazard-free?'],
      ['Is fire safety equipment (extinguishers, exits) checked and accessible?'],
      ['Do you hold a current RSA certificate if serving alcohol?'],
      ['Any guest complaints, incidents, or maintenance issues to report?', 'textarea'],
      ['I confirm I am ready for my shift and will uphold service and safety standards', 'signature'],
    ],
  },
  {
    key: 'retail',
    position: 'Retail / Warehouse Worker',
    description: 'Retail and warehouse daily pre-start safety and operations check.',
    questions: [
      ['Are you fit for work and free from injury or illness?'],
      ["Have you been briefed on today's priorities?"],
      ['Are aisles, walkways, and emergency exits clear of obstructions?'],
      ['Have you inspected your workstation or area for hazards?'],
      ["Is your manual handling technique correct for today's tasks?"],
      ['Is PPE being worn? (steel-cap boots, hi-vis for warehouse)'],
      ['Are forklift and equipment licences valid for operators today?'],
      ['Any stock discrepancies, incidents, or safety issues to report?', 'textarea'],
      ['I confirm I am ready for my shift and will follow all safety procedures', 'signature'],
    ],
  },
  {
    key: 'security',
    position: 'Security Officer',
    description: 'Security officer daily pre-start check and briefing declaration.',
    questions: [
      ['Are you fit for duty and free from fatigue or impairment?'],
      ['Is your security licence current and carried on your person?'],
      ["Have you been briefed on today's site-specific instructions?"],
      ['Is your communication equipment (radio, phone) charged and working?'],
      ['Is your uniform and PPE complete and presentable?'],
      ['Have you reviewed any threat or incident alerts from the previous shift?'],
      ['Do you know the emergency procedures and escalation contacts for this site?'],
      ['Any incidents, suspicious activity, or concerns to report?', 'textarea'],
      ['I confirm I am fit for duty and have received today\'s briefing', 'signature'],
    ],
  },
  {
    key: 'office',
    position: 'Office Staff',
    description: 'Daily Pre-Start H&S Checklist — New Zealand Office Worksite. Complete before commencing work each day.',
    questions: [
      ['Describe your main tasks or activities for today', 'textarea'],
      ['Are you fit and well to work today?'],
      ['Are you free from alcohol, drugs, or medication effects?'],
      ['Do you have any injury or issue that may affect your work?'],
      ['Tick any hazards present in your work area today', 'checkbox', [
        'Slips, trips, falls (wet floors, cables)',
        'Manual handling / lifting boxes',
        'Poor workstation ergonomics',
        'Electrical hazards (leads, equipment)',
        'Hot water / kitchen hazards',
        'Working alone after hours',
        'Fire hazards',
        'Other',
      ]],
      ['Controls in place for identified hazards', 'textarea'],
      ['Is your workstation set up ergonomically correct? (screen height, chair, posture)'],
      ['Are walkways and emergency exits clear of obstructions?'],
      ['Have you completed any required ergonomic or health & safety training?'],
      ['Do you know the emergency evacuation procedure and assembly point?'],
      ['Is first aid kit available and who is the trained first aider?', 'text'],
      ['Do you understand you must stop work if conditions become unsafe?'],
      ['Any safety concerns or incidents to report before starting?', 'textarea'],
      ["I confirm I understand today's work, hazards, controls, and I will stop work if unsafe", 'signature'],
    ],
  },
];

export const STARTER_FORMS: StarterForm[] = [
  ...INDUSTRIES.map((industry) => ({
    title: `Pre-Start Checklist — ${industry.position}`,
    form_type: 'prestart',
    industry: industry.key,
    description: industry.description,
    questions: materialize(industry.questions, `${industry.key}_prestart`),
    require_before_clockin: true,
    frequency: 'daily',
    is_active: true,
  })),
  ...INDUSTRIES.map((industry) => ({
    title: `Health & Safety Inspection — ${industry.position}`,
    form_type: 'health_safety',
    industry: industry.key,
    description: `Health & Safety Inspection form for ${industry.position}. Edit to match your company requirements.`,
    questions: materialize(HS_QUESTIONS, `${industry.key}_hs`),
    require_before_clockin: false,
    frequency: 'daily',
    is_active: true,
  })),
];

// Safe to run more than once: only forms the workspace is missing are created,
// matched by title, so a retry never duplicates the library.
export async function seedStarterForms(svc: any, organizationId: string) {
  if (!organizationId) return [];
  const existing = await svc.entities.FormTemplate.filter({ organization_id: organizationId }, { limit: 500 });
  const items = Array.isArray(existing) ? existing : existing?.items || [];
  const known = new Set(items.map((form: any) => form.title));
  const missing = STARTER_FORMS.filter((form) => !known.has(form.title));
  if (!missing.length) return [];
  return svc.entities.FormTemplate.bulkCreate(
    missing.map((form) => ({ ...form, organization_id: organizationId })),
  );
}