// Industry-based form templates with pre-populated questions

export const INDUSTRIES = [
  { value: 'telecom', label: '📡 Telecommunications / Fibre' },
  { value: 'roading', label: '🛣️ Roading & Highways' },
  { value: 'steel_fixing', label: '🔩 Steel Fixing & Reinforcing' },
  { value: 'construction', label: '🏗️ Construction & Civil' },
  { value: 'electrical', label: '⚡ Electrical & Utilities' },
  { value: 'transport', label: '🚛 Transport & Logistics' },
  { value: 'mining', label: '⛏️ Mining & Resources' },
  { value: 'healthcare', label: '🏥 Healthcare & Aged Care' },
  { value: 'hospitality', label: '🍽️ Hospitality & Events' },
  { value: 'retail', label: '🛒 Retail & Warehousing' },
  { value: 'security', label: '🔒 Security Services' },
  { value: 'office', label: '🏢 Office Staff' },
  { value: 'custom', label: '✏️ Start from scratch' },
];

// Worker position options (map 1:1 to INDUSTRY_TEMPLATES keys for form matching)
export const POSITIONS = [
  { value: 'telecom', label: 'Telecom / Fibre Technician' },
  { value: 'roading', label: 'Roadworker' },
  { value: 'steel_fixing', label: 'Steel Fixer' },
  { value: 'construction', label: 'Construction Worker' },
  { value: 'electrical', label: 'Electrician' },
  { value: 'transport', label: 'Driver / Transport Operator' },
  { value: 'mining', label: 'Mining Worker' },
  { value: 'healthcare', label: 'Healthcare Worker' },
  { value: 'hospitality', label: 'Hospitality Worker' },
  { value: 'retail', label: 'Retail / Warehouse Worker' },
  { value: 'security', label: 'Security Officer' },
  { value: 'office', label: 'Office Staff' },
];

let _id = 0;
function q(label, type = 'yes_no', options = []) {
  _id++;
  return { id: `tpl_${_id}_${Math.random().toString(36).slice(2)}`, label, type, required: true, options };
}

export const INDUSTRY_TEMPLATES = {
  // ─── TELECOM / FIBRE (NZ H&S Prestart) ───────────────────────────────────
  telecom: {
    formType: 'prestart',
    description: 'Daily Pre-Start H&S Checklist — New Zealand Telecom / Fibre Worksite. Complete before commencing work each day.',
    questions: [
      // Section 1 – Today's Work
      q('Briefly describe the work to be done today', 'textarea'),

      // Section 2 – Worker Fitness
      q('Are you fit and well to work today?'),
      q('Are you free from alcohol, drugs, or medication effects?'),
      q('Do you have any injury or issue that may affect your work?'),

      // Section 3 – Hazards Today
      q('Tick any hazards present at today\'s site', 'checkbox', [
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
      ]),
      q('Describe controls in place for identified hazards', 'textarea'),

      // Section 4 – PPE & Equipment
      q('Do you have the correct PPE for the job? (hard hat, hi-vis, gloves, safety boots)'),
      q('Are tools and equipment safe to use?'),
      q('Are ladders, leads, and power tools checked?'),

      // Section 5 – Emergency Check
      q('Do you know the emergency meeting point for this site?'),
      q('Is first aid kit available and accessible?'),
      q('Do you know who to contact in an emergency?'),
      q('Emergency contact name and number', 'text'),

      // Section 6 – Stop Work Rule
      q('Do you understand you must stop work if it becomes unsafe?'),
      q('Have you raised any safety concerns before starting?'),
      q('Detail any safety concerns (if none, write N/A)', 'textarea'),

      // Sign-On
      q('I confirm I understand today\'s work, hazards, controls, and I will stop work if unsafe', 'signature'),
    ],
  },

  // ─── ROADING & HIGHWAYS ───────────────────────────────────────────────────
  roading: {
    formType: 'prestart',
    description: 'Daily Pre-Start H&S Checklist — New Zealand Roading & Highways Worksite. Complete before commencing work each day.',
    questions: [
      // Today's Work
      q('Describe the roading work to be completed today (e.g. pavement, drainage, kerbing)', 'textarea'),

      // Worker Fitness
      q('Are you fit and well to work today?'),
      q('Are you free from alcohol, drugs, or medication effects?'),
      q('Do you have any injury or fatigue issue that may affect your work?'),

      // Traffic Management
      q('Has a Traffic Management Plan (TMP) been reviewed and is in place?'),
      q('Are all signs, cones, and barriers correctly placed per the TMP?'),
      q('Are all workers wearing hi-vis clothing visible to passing traffic?'),
      q('Has a traffic controller been briefed and positioned if required?'),

      // Hazards
      q('Tick any hazards present at today\'s site', 'checkbox', [
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
      ]),
      q('Controls in place for identified hazards', 'textarea'),

      // PPE & Equipment
      q('Is correct PPE worn? (hi-vis, hard hat, safety boots, gloves, eye protection)'),
      q('Has plant and equipment been pre-started and inspected?'),
      q('Are reversing alarms and safety devices on all plant operational?'),

      // Emergency Check
      q('Do you know the emergency assembly point for this site?'),
      q('Is first aid kit available and who is the trained first aider on site?', 'text'),
      q('Do you know the emergency services contact and site address to give them?'),

      // Stop Work Rule
      q('Do you understand you must stop work if conditions become unsafe?'),
      q('Any safety concerns or near misses to report before starting?', 'textarea'),

      // Sign-On
      q('I confirm I understand today\'s work, hazards, controls, and I will stop work if unsafe', 'signature'),
    ],
  },

  // ─── STEEL FIXING & REINFORCING ───────────────────────────────────────────
  steel_fixing: {
    formType: 'prestart',
    description: 'Daily Pre-Start H&S Checklist — New Zealand Steel Fixing & Reinforcing Worksite. Complete before commencing work each day.',
    questions: [
      // Today's Work
      q('Describe the steel fixing work to be done today (e.g. footings, columns, slabs)', 'textarea'),

      // Worker Fitness
      q('Are you fit and well to work today?'),
      q('Are you free from alcohol, drugs, or medication effects?'),
      q('Do you have any injury, fatigue, or physical issue that may affect your work?'),

      // Hazards
      q('Tick any hazards present at today\'s site', 'checkbox', [
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
      ]),
      q('Controls in place for identified hazards', 'textarea'),

      // PPE & Equipment
      q('Is correct PPE worn? (hard hat, hi-vis, steel-cap boots, gloves, cut-resistant gloves)'),
      q('Are protruding rebar ends capped or bent to prevent impalement?'),
      q('Are bar benders, tie guns, and cutting tools inspected and safe to use?'),
      q('Are lifting slings and lifting equipment tagged, rated, and inspected?'),

      // Working at Height
      q('If working on elevated formwork, is fall protection in place (guardrails, safety nets, harness)?'),
      q('Is the formwork and propping inspected and certified for loading?'),

      // Manual Handling
      q('Have team lifts or mechanical aids been arranged for heavy bundles of rebar?'),

      // Emergency Check
      q('Do you know the emergency assembly point for this site?'),
      q('Is first aid kit available and accessible?'),
      q('Do you know who to contact in an emergency?'),

      // Stop Work Rule
      q('Do you understand you must stop work if conditions become unsafe?'),
      q('Any safety concerns or near misses to report before starting?', 'textarea'),

      // Sign-On
      q('I confirm I understand today\'s work, hazards, controls, and I will stop work if unsafe', 'signature'),
    ],
  },

  // ─── CONSTRUCTION & CIVIL ─────────────────────────────────────────────────
  construction: {
    formType: 'prestart',
    description: 'Daily Pre-Start H&S Checklist — New Zealand Construction & Civil Worksite. Complete before commencing work each day.',
    questions: [
      // Today's Work
      q('Describe the construction work to be completed today', 'textarea'),

      // Worker Fitness
      q('Are you fit and well to work today?'),
      q('Are you free from alcohol, drugs, or medication effects?'),
      q('Do you have any injury or issue that may affect your work?'),

      // Site Induction
      q('Have you completed a site induction or been briefed on today\'s site rules?'),
      q('Have you reviewed the relevant SWMS / Job Safety Analysis for today\'s tasks?'),

      // Hazards
      q('Tick any hazards present at today\'s site', 'checkbox', [
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
      ]),
      q('Controls in place for identified hazards', 'textarea'),

      // PPE & Equipment
      q('Is correct PPE worn? (hard hat, hi-vis, safety boots, gloves, eye protection)'),
      q('Are tools, plant, and equipment inspected and safe to use?'),
      q('Are exclusion zones and barricades correctly set up?'),

      // Working at Height
      q('If working at height — is fall protection in place (scaffolding, guardrails, or harness)?'),

      // Excavation
      q('If excavating — has a ground-breaking permit been obtained and underground services located?'),

      // Emergency Check
      q('Do you know the emergency assembly point for this site?'),
      q('Is first aid kit available and who is the trained first aider?', 'text'),
      q('Do you know the emergency contact number and site address?'),

      // Stop Work Rule
      q('Do you understand you must stop work if it becomes unsafe?'),
      q('Any safety concerns or near misses to report before starting?', 'textarea'),

      // Sign-On
      q('I confirm I understand today\'s work, hazards, controls, and I will stop work if unsafe', 'signature'),
    ],
  },

  // ─── ELECTRICAL ───────────────────────────────────────────────────────────
  electrical: {
    formType: 'prestart',
    description: 'Daily Pre-Start H&S Checklist — Electrical & Utilities. Complete before commencing work.',
    questions: [
      q('Describe the electrical work to be completed today', 'textarea'),
      q('Are you fit and well to work today?'),
      q('Are you free from alcohol, drugs, or medication effects?'),
      q('Are you licensed and authorised for today\'s electrical work?'),
      q('Has lockout/tagout (LOTO) been applied to all isolated equipment?'),
      q('Have you tested with a voltage tester before commencing work?'),
      q('Is PPE serviceable? (insulated gloves, arc flash gear, safety glasses)'),
      q('Have you identified all underground cables and overhead services?'),
      q('Is a safety observer in place for high-risk tasks?'),
      q('Do you know the emergency assembly point and first aider on site?'),
      q('Do you understand you must stop work if conditions become unsafe?'),
      q('Any safety concerns or incidents to report?', 'textarea'),
      q('I declare I am fit for work and compliant with electrical safety regulations', 'signature'),
    ],
  },

  // ─── TRANSPORT ────────────────────────────────────────────────────────────
  transport: {
    formType: 'prestart',
    description: 'Daily vehicle and driver pre-start check for transport and logistics.',
    questions: [
      q('Are you free from fatigue? (Have you had sufficient rest since last shift?)'),
      q('Are you free from alcohol, drugs, or medication effects?'),
      q('Do you hold a valid licence for the vehicle you will be operating today?'),
      q('Have you completed a walkaround vehicle inspection?'),
      q('Are tyres, lights, brakes, and mirrors in good working condition?'),
      q('Is the vehicle\'s load secured correctly?'),
      q('Are you familiar with today\'s route and any hazards?'),
      q('Do you have a charged mobile and emergency contact details?'),
      q('Vehicle condition', 'select', ['Good – no defects', 'Minor defect – reported', 'Major defect – not to be used']),
      q('Any vehicle damage or defects to report?', 'textarea'),
      q('I confirm I am fit to drive and the vehicle is roadworthy', 'signature'),
    ],
  },

  // ─── MINING ───────────────────────────────────────────────────────────────
  mining: {
    formType: 'prestart',
    description: 'Mining and resources site pre-start safety check.',
    questions: [
      q('Have you completed drug and alcohol testing as required?'),
      q('Are you free from fatigue and fit for your shift?'),
      q('Have you attended today\'s pre-shift toolbox talk?'),
      q('Is PPE serviceable? (hard hat, hi-vis, boots, gloves, ear and eye protection)'),
      q('Have you reviewed the take 5 or hazard ID for your work area?'),
      q('Is your equipment pre-start check completed and recorded?'),
      q('Are you aware of all exclusion zones and blast areas?'),
      q('Do you know the emergency muster point and evacuation procedure?'),
      q('Any hazards, near misses, or incidents to report?', 'textarea'),
      q('I acknowledge today\'s safety requirements and will comply with site rules', 'signature'),
    ],
  },

  // ─── HEALTHCARE ───────────────────────────────────────────────────────────
  healthcare: {
    formType: 'prestart',
    description: 'Healthcare and aged care worker daily pre-start and wellness check.',
    questions: [
      q('Are you feeling well and free from illness or symptoms today?'),
      q('Have you had adequate rest (minimum 8 hours) since your last shift?'),
      q('Are you up to date with required vaccinations and health clearances?'),
      q('Do you have access to all required PPE (gloves, mask, apron) for your shift?'),
      q('Have you reviewed any updated care plans or client notes?'),
      q('Are you aware of any infection control alerts or isolation requirements?'),
      q('Do you know the emergency and escalation procedures for your ward/site?'),
      q('Any incidents, medication errors, or concerns to report from your last shift?', 'textarea'),
      q('I confirm I am fit for duty and will comply with infection control protocols', 'signature'),
    ],
  },

  // ─── HOSPITALITY ──────────────────────────────────────────────────────────
  hospitality: {
    formType: 'prestart',
    description: 'Pre-shift check for hospitality and events staff.',
    questions: [
      q('Are you fit for work today and free from illness?'),
      q('Have you reviewed today\'s event or service schedule?'),
      q('Is your uniform complete and presentation standards met?'),
      q('Have you completed required food handling and hygiene checks?'),
      q('Are all kitchen/service areas clean and hazard-free?'),
      q('Is fire safety equipment (extinguishers, exits) checked and accessible?'),
      q('Do you hold a current RSA certificate if serving alcohol?'),
      q('Any guest complaints, incidents, or maintenance issues to report?', 'textarea'),
      q('I confirm I am ready for my shift and will uphold service and safety standards', 'signature'),
    ],
  },

  // ─── RETAIL ───────────────────────────────────────────────────────────────
  retail: {
    formType: 'prestart',
    description: 'Retail and warehouse daily pre-start safety and operations check.',
    questions: [
      q('Are you fit for work and free from injury or illness?'),
      q('Have you been briefed on today\'s priorities?'),
      q('Are aisles, walkways, and emergency exits clear of obstructions?'),
      q('Have you inspected your workstation or area for hazards?'),
      q('Is your manual handling technique correct for today\'s tasks?'),
      q('Is PPE being worn? (steel-cap boots, hi-vis for warehouse)'),
      q('Are forklift and equipment licences valid for operators today?'),
      q('Any stock discrepancies, incidents, or safety issues to report?', 'textarea'),
      q('I confirm I am ready for my shift and will follow all safety procedures', 'signature'),
    ],
  },

  // ─── SECURITY ─────────────────────────────────────────────────────────────
  security: {
    formType: 'prestart',
    description: 'Security officer daily pre-start check and briefing declaration.',
    questions: [
      q('Are you fit for duty and free from fatigue or impairment?'),
      q('Is your security licence current and carried on your person?'),
      q('Have you been briefed on today\'s site-specific instructions?'),
      q('Is your communication equipment (radio, phone) charged and working?'),
      q('Is your uniform and PPE complete and presentable?'),
      q('Have you reviewed any threat or incident alerts from the previous shift?'),
      q('Do you know the emergency procedures and escalation contacts for this site?'),
      q('Any incidents, suspicious activity, or concerns to report?', 'textarea'),
      q('I confirm I am fit for duty and have received today\'s briefing', 'signature'),
    ],
  },

  // ─── OFFICE STAFF ──────────────────────────────────────────────────────────
  office: {
    formType: 'prestart',
    description: 'Daily Pre-Start H&S Checklist — New Zealand Office Worksite. Complete before commencing work each day.',
    questions: [
      q('Describe your main tasks or activities for today', 'textarea'),
      q('Are you fit and well to work today?'),
      q('Are you free from alcohol, drugs, or medication effects?'),
      q('Do you have any injury or issue that may affect your work?'),
      q('Tick any hazards present in your work area today', 'checkbox', [
        'Slips, trips, falls (wet floors, cables)',
        'Manual handling / lifting boxes',
        'Poor workstation ergonomics',
        'Electrical hazards (leads, equipment)',
        'Hot water / kitchen hazards',
        'Working alone after hours',
        'Fire hazards',
        'Other',
      ]),
      q('Controls in place for identified hazards', 'textarea'),
      q('Is your workstation set up ergonomically correct? (screen height, chair, posture)'),
      q('Are walkways and emergency exits clear of obstructions?'),
      q('Have you completed any required ergonomic or health & safety training?'),
      q('Do you know the emergency evacuation procedure and assembly point?'),
      q('Is first aid kit available and who is the trained first aider?', 'text'),
      q('Do you understand you must stop work if conditions become unsafe?'),
      q('Any safety concerns or incidents to report before starting?', 'textarea'),
      q('I confirm I understand today\'s work, hazards, controls, and I will stop work if unsafe', 'signature'),
    ],
  },

  // ─── CUSTOM ───────────────────────────────────────────────────────────────
  custom: {
    formType: 'prestart',
    description: '',
    questions: [],
  },
};