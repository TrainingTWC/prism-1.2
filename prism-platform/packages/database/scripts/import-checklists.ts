// ════════════════════════════════════════════════════════════════
//  Prism Platform — Legacy Checklist Migration Script
// ════════════════════════════════════════════════════════════════
//
//  Extracts ALL hardcoded checklists from the old Prism TSX app
//  and imports them as Programs → Sections → Questions in the DB.
//
//  Usage:
//    cd packages/database
//    npx tsx scripts/import-checklists.ts
//
//  This script is IDEMPOTENT — safe to run multiple times.
//  Uses deterministic UUIDs so re-runs update rather than duplicate.
//
// ════════════════════════════════════════════════════════════════

import { PrismaClient, QuestionType, ProgramType, ProgramStatus } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();
const COMPANY_ID = '00000000-0000-0000-0000-000000000001';

// ── Deterministic UUID generator ──
function uuid(input: string): string {
  const hash = createHash('sha256').update(input).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    '8' + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-');
}

// ── Types ──
interface Q {
  text: string;
  questionType: QuestionType;
  weight?: number;
  negativeWeight?: number;
  correctAnswer?: string;
  options?: any[];
  ratingScale?: { min: number; max: number; labels?: Record<string, string> };
  allowImages?: boolean;
  allowComments?: boolean;
  scoringEnabled?: boolean;
  required?: boolean;
  description?: string;
}

interface S {
  title: string;
  description?: string;
  weight?: number;
  isCritical?: boolean;
  maxScore?: number;
  questions: Q[];
}

interface P {
  name: string;
  description?: string;
  type: ProgramType;
  department?: string;
  status?: ProgramStatus;
  scoringEnabled?: boolean;
  signatureEnabled?: boolean;
  imageUploadEnabled?: boolean;
  timerDuration?: number;
  scoringConfig?: any;
  sections: S[];
}

// ── Question helpers ──
/** YES/NO question with weight=1 */
function yn(text: string): Q {
  return { text, questionType: QuestionType.YES_NO, weight: 1 };
}

/** YES/NO question with custom weight */
function ynw(text: string, w: number, wneg?: number): Q {
  return { text, questionType: QuestionType.YES_NO, weight: w, ...(wneg !== undefined ? { negativeWeight: wneg } : {}) };
}

/** DROPDOWN question (QA-style compliance) */
function qa(text: string, w: number, opts: string[]): Q {
  return { text, questionType: QuestionType.DROPDOWN, weight: w, options: opts };
}

/** MULTIPLE_CHOICE question with correct answer */
function mcq(text: string, opts: Record<string, string>, correct: string): Q {
  return {
    text,
    questionType: QuestionType.MULTIPLE_CHOICE,
    weight: 1,
    options: Object.entries(opts).map(([k, v]) => ({ label: k, text: v })),
    correctAnswer: correct,
  };
}

/** Weighted MCQ (campus hiring style) */
function wmcq(text: string, opts: Record<string, { text: string; weight: number }>, desc?: string): Q {
  return {
    text,
    questionType: QuestionType.MULTIPLE_CHOICE,
    weight: Math.max(...Object.values(opts).map(o => o.weight)),
    options: Object.entries(opts).map(([k, v]) => ({ label: k, text: v.text, weight: v.weight })),
    ...(desc ? { description: desc } : {}),
  };
}

/** RATING_SCALE question (likert) */
function likert(text: string, wp: number): Q {
  return {
    text,
    questionType: QuestionType.RATING_SCALE,
    weight: wp,
    ratingScale: { min: 1, max: 5, labels: { '1': 'Strongly Disagree', '2': 'Disagree', '3': 'Neutral', '4': 'Agree', '5': 'Strongly Agree' } },
  };
}

/** YES/NO/NA dropdown question with custom weight (for audit checklists) */
function yna(text: string, w: number, wneg?: number): Q {
  return { text, questionType: QuestionType.DROPDOWN, weight: w, options: ['Yes', 'No', 'N/A'], ...(wneg !== undefined ? { negativeWeight: wneg } : {}) };
}

/** YES/NO/NA dropdown question with weight=1 */
function yna1(text: string): Q {
  return { text, questionType: QuestionType.DROPDOWN, weight: 1, options: ['Yes', 'No', 'N/A'] };
}

/** TEXT question (open-ended) */
function txt(text: string): Q {
  return { text, questionType: QuestionType.TEXT, weight: 0, scoringEnabled: false };
}

/** RATING_SCALE with scored choices (HR style) */
function scored(text: string, choices: { label: string; score: number }[]): Q {
  return {
    text,
    questionType: QuestionType.RATING_SCALE,
    weight: 5,
    options: choices,
    ratingScale: { min: 1, max: 5 },
  };
}

// ── Brew League shared question sets ──
function groomingQuestions(): Q[] {
  return [
    ynw('Has the barista sanitized their hands (Using Soap)', 1),
    ynw('Is the barista apron free from stains and damage', 1),
    ynw('Is the barista wearing a name tag', 1),
    ynw('Is the barista wearing black formal pants', 1),
    ynw('Is the barista wearing black shoes', 1),
    ynw('Barista following the grooming standards (Beard/Hair/Make-up) Male and female', 2),
    ynw('Is the baristas nails trimmed', 1),
    ynw('Only permitted jewelry worn', 1),
  ];
}

function espressoDialInShot(): Q[] {
  return [
    ynw('Is the barista able to change the grind size based on under/over extracted shot', 5),
    ynw('Is the barista able to explain the dial-in process', 3),
    ynw('Did the barista waste a dose after changing the grind size every time', 3),
    ynw('Did the barista check the weight of the ground coffee after changing the grind size', 2),
    ynw('Is the barista able to set the grinding time to dispense the right amount for dose', 2),
    ynw('Area around the grinder cleaned with brush to clear out grounds', 2),
    ynw('Porta filter wiped with dry grey cloth', 2),
    ynw('Porta filter basket free from brewed coffee grounds', 2),
    ynw('Right basket porta filter used for intended shot', 2),
    ynw('Right grammage of ground coffee taken', 2),
    ynw('Coffee grounds levelled using tap/chop method before tamping', 3),
    ynw('Tamping machine set as per standard', 2),
    ynw('Porta filter rim wiped to clear loose coffee grounds before inserting into group head', 2),
    ynw('Barista Flushes the grouphead before insert', 3),
    ynw('Drip tray wiped with the right green cloth after flushing', 2),
    ynw('Porta filter inserted into group head smoothly without knocking', 3),
    ynw('Right extraction button pressed within 3 seconds of inserting the porta filter', 3),
    ynw('Did the espresso flow evenly from both the spouts', 3),
    ynw('Was the shot extracted within the brew time', 5),
    ynw('Was the shot extracted within the yield (+/- 1 g)', 5),
  ];
}

function cupExtraction(hasPreWarmed: boolean): Q[] {
  const qs: Q[] = [];
  if (hasPreWarmed) qs.push(ynw('Is the cup pre-warmed before extraction', 2));
  qs.push(
    ynw('Porta filter wiped with dry grey cloth', 2),
    ynw('Porta filter basket free from brewed coffee grounds', 2),
    ynw('Right basket porta filter used for intended shot', 2),
    ynw('Right grammage of ground coffee taken', 2),
    ynw('Coffee grounds levelled using tap/chop method before tamping', 3),
    ynw('Tamping machine set as per standard', 2),
    ynw('Porta filter rim wiped to clear loose coffee grounds before inserting into group head', 2),
    ynw('Barista Flushes the grouphead before insert', 3),
    ynw('Drip tray wiped with the right green cloth after flushing', 2),
    ynw('Porta filter inserted into group head smoothly without knocking', 3),
    ynw('Right extraction button pressed within 3 seconds of inserting the porta filter', 3),
    ynw('Did the espresso flow evenly from both the spouts', 3),
    ynw('Was the shot extracted within the brew time', 5),
    ynw('Was the shot extracted within the yield (+/- 1 g)', 5),
  );
  return qs;
}

function milkSteaming(): Q[] {
  return [
    ynw('Steaming wand is purged before use', 3),
    ynw('Is the Barista using a clean milk pitcher for every order', 2),
    ynw('Is the barista using the right milk pitcher for the intended beverage size', 3),
    ynw('Is the barista using cold milk stored in the chiller', 3),
    ynw('Is the milk pouch stored in the 900ml pitcher', 1),
    ynw('Is the barista taking the right amount of milk for the intended beverage size', 3),
    ynw('Is the barista able to create the right consistency of foam for a latte/Cappuccino/Flat white', 3),
    ynw('Steaming wand is wiped & purged after use', 3),
    ynw('Did the barista use the right green cloth to wipe the steam wand', 3),
    ynw('Did the barista store the green cloth in the GN pan after use', 2),
  ];
}

function cupPouringAM(): Q[] {
  return [
    ynw('Did the barista pull the espresso shot within 30 seconds of steaming the milk', 3),
    ynw('Did the barista pour the milk within 30 seconds of pulling the shot', 3),
    ynw('Milk poured from the correct height', 2),
    ynw('Did the barista create a latte art pattern', 5),
    ynw('Did the barista wipe the cup before serving', 2),
  ];
}

function cupPouringRegion(): Q[] {
  return [
    ynw('Does the barista tap the pitcher to remove excess bubbles (if any)', 1),
    ynw('Did the barista swirl the pitcher to ensure the milk and foam is well mixed', 1),
    ynw('Barista able to create latte art in the cup (Cappuccino-Heart, Latte-Tulip/Rosetta, Flat white-Single dot)', 5),
    ynw('No spillage of espresso or milk on the outer part of the cup', 2),
    ynw('Milk wastage less than 50ml', 3),
    ynw('Did the barista clean the milk pitcher after use', 1),
  ];
}

// ══════════════════════════════════════════════════════════════
//  PROGRAM 1: Operations Audit
// ══════════════════════════════════════════════════════════════
const operationsAudit: P = {
  name: 'Operations Audit',
  description: 'Area Manager operational visit checklist covering store readiness, service quality, financials, customer experience, and team engagement.',
  type: ProgramType.OPERATIONAL_SURVEY,
  department: 'Operations',
  scoringEnabled: true,
  signatureEnabled: false,
  imageUploadEnabled: true,
  sections: [
    {
      title: 'Cheerful Greeting',
      questions: [
        yna1('Is the store front area clean and maintained?'),
        yna1('Is the signage clean and are all lights functioning?'),
        yna1('Are the glass and doors smudge-free?'),
        yna1('Do promotional displays reflect current offers?'),
        yna1('Are POS tent cards as per the latest communication?'),
        yna1('Are menu boards/DMB as per the latest communication?'),
        yna1('Does the café have a welcoming environment (music, lighting, AC, aroma)?'),
        yna1('Are washrooms cleaned and the checklist updated?'),
        yna1('Is the FDU counter neat, fully stocked, and set as per the planogram?'),
        yna1('Does the merch rack follow VM guidelines and attract attention?'),
        yna1('Is staff grooming (uniform, jewellery, hair and makeup) as per standards?'),
        yna1('Are all seating, furniture, and stations tidy and organized?'),
        yna1('Is the engine area clean and ready for operations?'),
      ],
    },
    {
      title: 'Order Taking Assistance',
      questions: [
        yna1('Is suggestive selling happening at the POS?'),
        yna1('Is the POS partner updated on the latest promos and item availability?'),
        yna1('Has order-taking time been recorded for 5 customers?'),
        yna1('Is there sufficient cash and change at the POS?'),
        yna1('Are valid licenses displayed and expiries checked (medical reports)?'),
        yna1('Are cash audits completed and verified with the logbook?'),
        yna1('Are daily banking reports tallied?'),
        yna1('Has CPI been reviewed through the FAME pilot?'),
        yna1('Are Swiggy/Zomato metrics (RDC, MFR, visibility) reviewed, and are Food Lock on LS and stock control on UrbanPiper managed per stock availability/opening inventory?'),
        yna1('Are all food and drinks served as per SOP?'),
        yna1('Are food orders placed based on the 4-week sales trend?'),
      ],
    },
    {
      title: 'Friendly & Accurate Service',
      questions: [
        yna1('Is equipment cleaned and maintained?'),
        yna1('Are temperature checks done with the Therma Pen and logs updated?'),
        yna1('Is documentation (GRN, RSTN, STN & TO) completed?'),
        yna1('Is fast-moving SKU availability checked and validated with LS?'),
        yna1('Is the thawing chart validated against actual thawing?'),
        yna1('Are deployment roles clear, with coaching and appreciation done by the MOD?'),
        yna1('Are there no broken/unused tools stored in the store?'),
        yna1('Is garbage segregated properly (wet/dry)?'),
        yna1('Are LTO products served as per standards?'),
        yna1('Is the coffee and food dial-in process followed?'),
        yna1('Are R.O.A.S.T. and app orders executed accurately?'),
        yna1('Have 5 order service times been validated?'),
        yna1('Have open maintenance-related points been reviewed?'),
      ],
    },
    {
      title: 'Feedback with Solution',
      questions: [
        yna1('Has COGS been reviewed, with actions in place per last month P&L feedback?'),
        yna1('Have BSC targets vs achievements been reviewed?'),
        yna1('Has people budget vs actuals (labour cost/bench planning) been reviewed?'),
        yna1('Has variance in stock (physical vs system) been verified?'),
        yna1('Have the top 10 wastage items been reviewed?'),
        yna1('Have store utilities (units, chemical use) been reviewed?'),
        yna1('Have shift targets, briefings, and goal tracking been conducted?'),
        yna1('Have new staff training and bench plans been reviewed?'),
        yna1('Have Training and QA audits been reviewed?'),
        yna1('Has the duty roster (off/coff, ELCL, tenure) been checked and attendance ensured as per ZingHR?'),
        yna1('Have temperature and thawing logs been validated?'),
        yna1('Have audit and data findings been cross-checked with store observations?'),
        yna1('Is the pest control layout updated?'),
      ],
    },
    {
      title: 'Enjoyable Experience',
      questions: [
        yna1('Have 2 new and 2 repeat customers been engaged, with feedback documented?'),
        yna1('Are seating and stations adjusted as per customer requirements?'),
        yna1('Is the team proactively assisting customers?'),
        yna1('Is CCTV checked to monitor customer service during peak hours?'),
        yna1('Is CCTV backup (minimum 60 days) in place and are black spots checked?'),
        yna1('Is opening/closing footage reviewed for correct practices?'),
        yna1('Are there no personal items/clutter in guest areas, with belongings kept in lockers/designated places?'),
      ],
    },
    {
      title: 'Enthusiastic Exit',
      questions: [
        yna1('Are there no unresolved issues at exits?'),
        yna1('Is the final interaction cheerful and courteous?'),
        yna1('Has a consolidated action plan been created with the Store Manager?'),
        yna1('Have top performers been recognized?'),
        yna1('Have wins been celebrated and improvement areas communicated?'),
        yna1('Has the team been motivated for ongoing improvement?'),
      ],
    },
  ],
};

// ══════════════════════════════════════════════════════════════
//  PROGRAM 2: QA Audit
// ══════════════════════════════════════════════════════════════
const QA_BINARY = ['Compliant', 'Non-Compliant'];
const QA_FULL = ['Compliant', 'Partially Compliant', 'Non-Compliant', 'N/A'];

const qaAudit: P = {
  name: 'QA Audit',
  description: 'Quality Assurance audit with zero-tolerance checks, store compliance, maintenance, and HR verification. Zero-tolerance failures result in audit score of 0.',
  type: ProgramType.QA_AUDIT,
  department: 'Quality',
  scoringEnabled: true,
  signatureEnabled: true,
  imageUploadEnabled: true,
  scoringConfig: { failOnCritical: true, scoreDisplay: 'percentage' },
  sections: [
    {
      title: 'Zero Tolerance',
      isCritical: true,
      maxScore: 24,
      questions: [
        qa('All employees have valid medical fitness certificates and food safety training.', 4, QA_BINARY),
        qa('No expired or spoiled products found in storage, display, or service areas.', 4, QA_BINARY),
        qa('Hot holding temperature ≥ 63 °C and cold holding ≤ 5 °C.', 4, QA_BINARY),
        qa('Hand-washing stations functional with soap, sanitiser, and paper towels.', 4, QA_BINARY),
        qa('No evidence of pest activity (droppings, nesting, live pests) in food zones.', 4, QA_BINARY),
        qa('Allergen information correctly displayed and staff aware of allergen protocols.', 4, QA_BINARY),
      ],
    },
    {
      title: 'Store',
      maxScore: 188,
      questions: [
        qa('Personal belongings stored outside food zones.', 2, QA_FULL),
        qa('Staff wearing clean uniforms, headgear, and closed shoes.', 2, QA_FULL),
        qa('Staff not eating, drinking, or smoking in prep areas.', 2, QA_FULL),
        qa('Jewellery removed; nails short, clean, unpolished.', 2, QA_FULL),
        qa('Staff free from skin infections/illness.', 2, QA_FULL),
        qa('Cuts/wounds properly bandaged with waterproof dressing.', 2, QA_FULL),
        qa('Hand-wash followed as per SOP after breaks, handling waste, etc.', 2, QA_FULL),
        qa('Separate sinks for hand-washing and food prep.', 2, QA_FULL),
        qa('Air curtains/PVC strips at entrances in working condition.', 2, QA_FULL),
        qa('All food items stored at least 6 inches above floor.', 2, QA_FULL),
        qa('Cross-contamination controls in place (veg/non-veg separation).', 2, QA_FULL),
        qa('Prep tables, slicers, and cutting boards clean and sanitised.', 2, QA_FULL),
        qa('Cooling done within 2 hours to ≤ 5 °C.', 2, QA_FULL),
        qa('All food items labelled with name, prep date, and expiry.', 2, QA_FULL),
        qa('FIFO/FEFO followed for all raw materials and finished goods.', 2, QA_FULL),
        qa('Refrigerator/freezer temperature logs updated and within range.', 2, QA_FULL),
        qa('Chiller interiors clean, no ice build-up, shelves organised.', 2, QA_FULL),
        qa('Walk-in/blast chillers (if any) maintained and temperature-logged.', 2, QA_FULL),
        qa('Dry storage area clean, labelled, and well-ventilated.', 2, QA_FULL),
        qa('No food stored directly on the floor.', 2, QA_FULL),
        qa('Packaging material food-grade and stored away from chemicals.', 2, QA_FULL),
        qa('Food Display Unit maintained at correct temperature.', 2, QA_FULL),
        qa('FDU products covered, labelled with MRD.', 2, QA_FULL),
        qa('Tongs/gloves used to handle displayed food.', 2, QA_FULL),
        qa('Non-food items stored separately from food items.', 2, QA_FULL),
        qa('Receiving area clean and inspection area available.', 2, QA_FULL),
        qa('All incoming goods checked for quality, temperature, expiry.', 2, QA_FULL),
        qa('Rejected goods returned to vendor with proper documentation.', 2, QA_FULL),
        qa('GRN maintained for all received materials.', 2, QA_FULL),
        qa('No sub-standard/damaged items accepted.', 2, QA_FULL),
        qa('Ice used for beverages/food from potable water source.', 2, QA_FULL),
        qa('Thawing done by approved methods only (fridge/cold water/microwave).', 2, QA_FULL),
        qa('Reheating temperature reaches ≥ 74 °C before serving.', 2, QA_FULL),
        qa('Oil/fat quality checked and changed at correct intervals.', 2, QA_FULL),
        qa('Sampling and tasting done with clean/disposable utensils.', 2, QA_FULL),
        qa('All serving utensils clean and properly stored.', 2, QA_FULL),
        qa('Single-use items (cups, straws, napkins) stored hygienically.', 2, QA_FULL),
        qa('Sugar, salt, condiments in clean, covered, & labelled dispensers.', 2, QA_FULL),
        qa('Milk stored at ≤ 5 °C; opened packs dated and used within timeframe.', 2, QA_FULL),
        qa('Syrups, sauces, and toppings stored correctly and within expiry.', 2, QA_FULL),
        qa('Coffee beans stored in airtight containers, away from heat/sunlight.', 2, QA_FULL),
        qa('Grinder burrs clean and calibrated regularly.', 2, QA_FULL),
        qa('Espresso machine group heads purged and back-flushed.', 2, QA_FULL),
        qa('Blender jars cleaned after every use.', 2, QA_FULL),
        qa('Water filters (RO/UV) serviced as per schedule.', 2, QA_FULL),
        qa('Ice machine cleaned and sanitised as per schedule.', 2, QA_FULL),
        qa('Microwave and oven interiors clean.', 2, QA_FULL),
        qa('All ingredients/products received from approved vendors.', 2, QA_FULL),
        qa('Two beverages cross-verified with BRM.', 2, QA_FULL),
        qa('Weight, appearance, and filling of two products verified with FRM/food tag.', 2, QA_FULL),
        qa('No products repackaged or sealed with insulation tapes, rubber bands, or staples.', 2, QA_FULL),
        qa('Measuring tools available, clean, and used for food prep/filling.', 2, QA_FULL),
        qa('Packaging/wrapping material in contact with food is clean and food-grade.', 2, QA_FULL),
        qa('Espresso sensory aspects (taste, crema, texture, temperature) evaluated.', 2, QA_FULL),
        qa('No pest infestation observed; evidence of effective pest control available.', 2, QA_FULL),
        qa('MSDS available for all pest control chemicals.', 2, QA_FULL),
        qa('Pest control layout available and traps/fly catchers placed as per layout.', 2, QA_FULL),
        qa('Approved chemicals labeled and stored away from food area.', 2, QA_FULL),
        qa('Dilution charts readily available.', 2, QA_FULL),
        qa('MSDS reports for all cleaning chemicals available.', 2, QA_FULL),
        qa('Spray guns labeled and available.', 2, QA_FULL),
        qa('Dustbins kept closed, clean, and segregated (wet, dry, surgical).', 2, QA_FULL),
        qa('Waste not kept in BOH; disposed hygienically.', 2, QA_FULL),
        qa('Washroom clean and checklist maintained.', 2, QA_FULL),
        qa('Magic box inside BOH clean and in good condition.', 2, QA_FULL),
        qa('Cleaning of utensils and equipment done per schedule.', 2, QA_FULL),
        qa('No water stagnation in food zones.', 2, QA_FULL),
        qa('Staff aware of fire extinguisher usage.', 2, QA_FULL),
        qa('Team adheres to SOPs, recipes, hygiene, grooming, pest control, etc.', 2, QA_FULL),
        qa('Receiving temperatures noted using probe and recorded in app.', 2, QA_FULL),
        qa('Food transport vehicles clean, maintained, and temperature-checked.', 2, QA_FULL),
        qa('Temperature monitoring records updated in Terotam app.', 2, QA_FULL),
        qa('Measuring/monitoring devices calibrated periodically.', 2, QA_FULL),
        qa('Food handlers trained to handle food safely; training records available.', 2, QA_FULL),
        qa('Personal hygiene verification record updated.', 2, QA_FULL),
        qa('Documentation and records available and retained for at least one year.', 2, QA_FULL),
        qa('Pest control job card/record updated.', 2, QA_FULL),
        qa('Raw materials used on FIFO and FEFO basis.', 2, QA_FULL),
        qa('Color-coded microfiber cloths used as per area.', 2, QA_FULL),
        qa('Frozen products thawed per SOP.', 2, QA_FULL),
        qa('Glue pads and rodent boxes inspected and replaced as needed.', 2, QA_FULL),
        qa('Smallware cleaned every 3 hours.', 2, QA_FULL),
        qa('Food dial-in checklist updated.', 2, QA_FULL),
        qa('FSSAI & FSDB displayed visibly and valid.', 2, QA_FULL),
        qa('Person in charge holds valid FOSTAC certification.', 2, QA_FULL),
        qa('Drainages cleaned per SOP and properly covered.', 2, QA_FULL),
        qa('Veg/non-veg segregation and cleanliness of moulds maintained.', 2, QA_FULL),
        qa('Wet floor signs used as needed.', 2, QA_FULL),
        qa('Step stools/ladders used safely and maintained.', 2, QA_FULL),
        qa('Food Display Unit arranged neatly with tags, allergens, calorie info, and logos.', 2, QA_FULL),
        qa('Reusable condiments stored properly in clean containers.', 2, QA_FULL),
        qa('All signages (handwash, push/pull, etc.) in place.', 2, QA_FULL),
        qa('Digital/static menu boards functional and updated.', 2, QA_FULL),
      ],
    },
    {
      title: 'QA',
      maxScore: 6,
      questions: [
        qa('Potable water used in food meets IS 10500 standards; records maintained.', 2, QA_FULL),
        qa('Food material tested internally or via accredited lab.', 2, QA_FULL),
        qa('Induction training program and assessment for new employees completed.', 2, QA_FULL),
      ],
    },
    {
      title: 'Maintenance',
      maxScore: 22,
      questions: [
        qa('Windows opening to external environment kept closed and fitted with insect mesh.', 2, QA_FULL),
        qa('No wall, floor, door, or ceiling damage.', 2, QA_FULL),
        qa('No unsecured electrical wires.', 2, QA_FULL),
        qa('Lighting above food/packaging areas covered and clean.', 2, QA_FULL),
        qa('Fire extinguishers in working condition and not expired.', 2, QA_FULL),
        qa('No pest entry points (wall holes, drains, ceiling gaps, etc.).', 2, QA_FULL),
        qa('Pest-o-flash placed properly (max height 6 ft, away from food areas).', 2, QA_FULL),
        qa('Equipment (RO, Coffee Machine, Freezer etc.) Maintenance file checked.', 2, QA_FULL),
        qa('RO water service records available.', 2, QA_FULL),
        qa('Plumbing and fixtures maintained.', 2, QA_FULL),
        qa('Freezer, FDU, and chillers in good working condition.', 2, QA_FULL),
      ],
    },
    {
      title: 'HR',
      maxScore: 4,
      questions: [
        qa('Medical records for all staff including housekeeping available.', 2, QA_FULL),
        qa('Annual medical exams and vaccinations done as per schedule.', 2, QA_FULL),
      ],
    },
  ],
};

// ══════════════════════════════════════════════════════════════
//  PROGRAM 3: Finance Audit
// ══════════════════════════════════════════════════════════════
const financeAudit: P = {
  name: 'Finance Audit',
  description: 'Financial compliance audit covering cash handling, billing, inventory, documentation, POS, licenses, and CCTV monitoring.',
  type: ProgramType.COMPLIANCE_INSPECTION,
  department: 'Finance',
  scoringEnabled: true,
  signatureEnabled: true,
  imageUploadEnabled: true,
  sections: [
    {
      title: 'Cash Handling & Petty Cash',
      questions: [
        yna('Is the daily cash count verified against the POS report?', 2),
        yna('Is the petty cash maintained within the approved limit?', 1),
        yna('Are all petty cash vouchers properly documented and authorized?', 1),
        yna('Is the cash deposit slip matched with the banking statement?', 2),
        yna('Is the safe/cash box secured and access restricted?', 2),
        yna('Is the float amount correct at shift start?', 1),
      ],
    },
    {
      title: 'Billing & Transactions',
      questions: [
        yna('Are all transactions billed through the POS system?', 2),
        yna('Are void/cancel transactions properly authorized and documented?', 2),
        yna('Is the discount log maintained with proper approvals?', 1),
        yna('Are complimentary items logged and within limits?', 1),
        yna('Is the settlement report tallied at end of day?', 2),
        yna('Are digital payment reconciliations done daily?', 1),
      ],
    },
    {
      title: 'Product & Inventory Control',
      questions: [
        yna('Is the physical stock count matching system inventory?', 2),
        yna('Is the wastage log maintained and within acceptable limits?', 2),
        yna('Are GRN entries completed on time for all deliveries?', 1),
        yna('Is the FIFO/FEFO method followed for all stock?', 1),
        yna('Are variance reports reviewed and action taken?', 2),
        yna('Are inter-store transfers properly documented?', 1),
        yna('Is the ordering schedule followed as per guidelines?', 1),
      ],
    },
    {
      title: 'Documentation & Records',
      questions: [
        yna('Are attendance records maintained and tallied with ZingHR?', 1),
        yna('Is the duty roster updated and accessible?', 1),
        yna('Are maintenance and equipment service records up to date?', 1),
        yna('Are training records available for all employees?', 1),
      ],
    },
    {
      title: 'POS System & SOP Compliance',
      questions: [
        yna('Is the POS system functioning properly?', 2),
        yna('Are menu items and prices updated correctly in the POS?', 1),
        yna('Are closing reports generated and filed daily?', 1),
        yna('Is the POS access restricted to authorized personnel?', 1),
      ],
    },
    {
      title: 'Licenses & Certificates',
      questions: [
        yna('Are trade licenses available and displayed with proper validity?', 1),
        yna('Are Shop & Establishment licenses available and displayed with proper validity?', 1),
        yna('Is the FSSAI license available and displayed with proper validity?', 1),
        yna('Music licenses available and displayed with proper validity?', 1),
        yna('Is the GST certificate available and displayed with proper validity?', 1),
      ],
    },
    {
      title: 'CCTV Monitoring',
      questions: [
        yna('Is the CCTV system functioning properly?', 2),
        yna('Is there a backup of 30/60 days of footage with proper coverage of critical areas?', 2),
        yna('Are no SOP, compliance, or integrity violations observed in CCTV sample review?', 3),
      ],
    },
  ],
};

// ══════════════════════════════════════════════════════════════
//  PROGRAM 4: Training Assessment
// ══════════════════════════════════════════════════════════════
const trainingAssessment: P = {
  name: 'Training Assessment',
  description: 'Comprehensive training audit covering materials, LMS, buddy trainers, new joiner training, partner knowledge, TSA modules (Food, Coffee, CX), customer experience, and action planning.',
  type: ProgramType.TRAINING_ASSESSMENT,
  department: 'Training',
  scoringEnabled: true,
  imageUploadEnabled: true,
  sections: [
    {
      title: 'Training Materials',
      questions: [
        yna('FRM available at store?', 1),
        yna('BRM available at store?', 1),
        yna('One-pager – Hot/Cue Cards displayed?', 1),
        yna('One-pager – Cold/Cue Cards displayed?', 1),
        yna('Dial-in One-pager visible?', 2),
        yna('New-launch learning material available?', 1),
        yna('COFFEE & HD Playbook in store?', 1),
        yna('MSDS, chemical chart and Shelf life chart available?', 1),
        yna('Career Progression Chart & Reward Poster displayed?', 1),
      ],
    },
    {
      title: 'LMS Usage',
      questions: [
        yna('Orientation & Induction completed within 3 days of joining?', 4, -4),
        yna('All assessments & knowledge checks completed on LMS?', 4, -4),
        yna('Team uses LMS for new info & comms?', 2),
      ],
    },
    {
      title: 'Buddy Trainer Availability & Capability',
      questions: [
        yna('Does the café have at least 20% of the staff certified Buddy Trainers?', 2),
        yna('Have Buddy Trainers completed their Skill Check?', 2),
        yna('Are trainees rostered with Buddy Trainers and working in the same shift?', 1),
        yna('Have Buddy Trainers attended the BT workshop?', 2),
        yna('Can Buddy Trainers explain the 4-step training process effectively?', 2),
        yna('Can Buddy Trainers navigate Zing LMS flawlessly?', 1),
      ],
    },
    {
      title: 'New Joiner Training & Records',
      questions: [
        yna('Is the OJT book available for all partners?', 1),
        yna('Are trainees referring to the OJT book and completing their skill checks?', 1),
        yna('Is training progression aligned with the Training Calendar/Plan?', 1),
        yna('Are team members aware of post-barista training progressions?', 1),
        yna('Have managers completed SHLP training as per the calendar?', 2),
        yna('Are there at least 2 FOSTAC-certified managers in the store?', 2),
        yna('Is ASM/SM training completed as per the Training Calendar?', 2),
      ],
    },
    {
      title: 'Partner Knowledge',
      questions: [
        yna('Are team members aware of current company communications?', 2),
        yna('Ask a team member to conduct a Coffee Tasting & Sampling', 2),
        yna('Is Sampling being conducted as per the set guidelines?', 2),
        yna('Is Coffee Tasting engaging and effective?', 2),
        yna('Are team members aware of manual brewing methods and standards?', 2),
        yna('Are partners following grooming standards?', 2),
        yna('Ask questions about key topics: COFFEE, LEAST, ROAST, Dial-in, Milk Steaming, LTO, Values(RESPECT), MSDS, Chemical Dilution, Food Safety, and Security.', 3, -3),
      ],
    },
    {
      title: 'TSA - Food: Personal Hygiene',
      description: 'Training Skill Assessment — Food preparation personal hygiene section.',
      questions: [
        yna('Well-groomed as per TWC standards (uniform, nails, hair)', 1),
        yna('Washed and sanitized hands every 30 mins', 1),
        yna('Wears gloves or avoids direct food contact', 1),
      ],
    },
    {
      title: 'TSA - Food: Station Readiness',
      questions: [
        yna('All ingredients available for the day', 1),
        yna('All smallware available & in correct use', 1),
        yna('Station cleaned and sanitized', 1),
        yna('Station and smallware organized and clean', 1),
        yna('Clean dusters available at the station', 1),
        yna('FDU AT LEAST 70% stocked, clean, follows planogram', 1),
        yna('MRD stickers used correctly (FDU + Make Line)', 1),
        yna('Products stored at correct temperature', 1),
      ],
    },
    {
      title: 'TSA - Food: Food Preparation & Handling',
      questions: [
        yna('Recipe followed per SOP (Food Item 1)', 1),
        yna('Build followed per SOP (Food Item 1)', 1),
        yna('Recipe followed per SOP (Food Item 2)', 1),
        yna('Build followed per SOP (Food Item 2)', 1),
        yna('Used correct tools for preparation', 1),
        yna('Used appropriate key to heat/warm food (Merry chef/Oven)', 1),
        yna('Gloves changed correctly (veg/non-veg switch or as per TWC guidelines)', 1),
        yna('Consistently follows Clean-As-You-Go', 1),
        yna('Correct duster used for station cleaning', 1),
        yna('Follows First-In-First-Out for food items', 1),
        yna('Products checked visually before serving', 1),
        yna('Chips, condiments, cutlery, etc., provided per SOP', 1),
      ],
    },
    {
      title: 'TSA - Food: Standards Ownership',
      questions: [
        yna('Serves only food that meets TWC standards (fresh, safe, proper temp); knows what to do if not', 1),
      ],
    },
    {
      title: 'TSA - Coffee: Personal Hygiene',
      description: 'Training Skill Assessment — Coffee preparation personal hygiene section.',
      questions: [
        yna('Well-groomed as per TWC standards (uniform, nails, hair)', 1),
        yna('Washed and sanitized hands', 1),
        yna('Wears gloves at CBS', 1),
      ],
    },
    {
      title: 'TSA - Coffee: Station Readiness',
      questions: [
        yna('Station well stocked with Milk, Warm cups, coffee beans, steaming jars, filter papers, stirrers, spoons, blenders, blending jars and scissors', 1),
        yna('All type of milk (Fresh, Skim milk, Oats milk and Almond milk) are available', 1),
        yna('Leveller and temper is clean and set at the appropriate setting', 1),
        yna('All smallwares (stir spoon, frothing pitchers, appropriate pumps in syrups) available at stations', 1),
        yna('Espresso dial in is done', 1),
        yna('Trainee extracts the perfect espresso each time', 1),
        yna('Trainee follows the Espresso extraction steps as defined', 1),
        yna('Whipped cream is prepared as per standards', 1),
        yna('Station and smallware organized and clean', 1),
        yna('Clean dusters available at the station', 1),
        yna('Station cleaned and sanitized', 1),
        yna('MRD stickers used correctly', 1),
        yna('Products stored at correct temperature', 1),
      ],
    },
    {
      title: 'TSA - Coffee: Coffee Preparation & Handling',
      questions: [
        yna('Recipe followed per SOP for Cappuccino', 1),
        yna('Build followed per SOP for Cappuccino', 1),
        yna('Recipe followed per SOP for Latte', 1),
        yna('Build followed per SOP for Latte', 1),
        yna('Recipe followed per SOP for bev 3', 1),
        yna('Build followed per SOP for bev 3', 1),
        yna('Recipe followed per SOP for bev 4', 1),
        yna('Build followed per SOP for bev 4', 1),
        yna('Cappuccino is served with 70:30 milk foam ratio', 1),
        yna('Latte is served with silky smooth foam (90:10 ratio)', 1),
        yna('Milk steaming standards are followed (Milk quantity, clean pitcher, fresh cold milk)', 1),
        yna('Latte art is as per described standards', 1),
        yna('Used correct tools for preparation', 1),
        yna('Blenders, Shakers and frothing jugs are washed and clean after every use', 1),
        yna('Appropriate button is used to blend the beverages', 1),
        yna('Toppings and Garnishes are used as per described standards', 1),
        yna('Special instructions are read and followed while preparing the beverage', 1),
        yna('Cold brew is available and brewed as per TWC standards', 1),
        yna('Trainee is aware about the Cold brew', 1),
        yna('Trainee brews the manual brews as per TWC standards', 1),
        yna('Gloves changed correctly (after garbage handling or as per policy)', 1),
        yna('Consistently follows Clean-As-You-Go', 1),
        yna('Correct duster used for station cleaning', 1),
        yna('Follows First-In-First-Out for food items', 1),
        yna('Products checked visually before serving', 1),
        yna('Condiments, cutlery, etc., provided per SOP', 1),
      ],
    },
    {
      title: 'TSA - CX: Personal Hygiene',
      description: 'Training Skill Assessment — Customer Experience personal hygiene section.',
      questions: [
        yna('Grooming & Hygiene: Well-groomed as per TWC standards (uniform, nails, hair)', 1),
        yna('Hand Hygiene: Washed and sanitized hands', 1),
        yna('Food Handling: Wears gloves or avoids direct food contact', 1),
      ],
    },
    {
      title: 'TSA - CX: Station Readiness',
      questions: [
        yna('Washrooms clean and stocked', 1),
        yna('Service area clean (floor, chairs, tables)', 1),
        yna('Smallwares clean (salvers, plates, cutlery)', 1),
        yna('Furniture properly set', 1),
        yna('POS, Bars, merchandise, menus, etc. properly stocked', 1),
        yna('Float/change available for cash transactions', 1),
        yna('Checks communication for product availability', 1),
        yna('Verifies temperature, music, table cleanliness, service items, Wi-Fi, and delivery channels', 1),
      ],
    },
    {
      title: 'TSA - CX: Customer Handling',
      questions: [
        yna('Cheerful Greeting: Cheerfully welcomes customers, follows 2-meter rule', 1),
        yna('Builds rapport (eye contact, active listening, positive phrases)', 1),
        yna('Assists customers to find seating or offers help when needed', 1),
        yna('Order Taking Assistance: Upsells using customer interest and product knowledge', 1),
        yna('Accurately enters and verifies orders in POS', 1),
        yna('Applies applicable discounts correctly', 1),
        yna('Processes payments accurately and handles change', 1),
        yna('Closes transaction smoothly and provides table tag', 1),
        yna('Thanks customer, explains order delivery, listens to feedback', 1),
        yna('Friendly & Accurate service: Serves with attention to detail (salver balance, order name, cutlery, etc.)', 1),
        yna('Offers follow-up service and leaves customer satisfied', 1),
        yna('Clears table with courtesy, thanks guests on exit', 1),
      ],
    },
    {
      title: 'TSA - CX: Handling Feedback & Complaints',
      questions: [
        yna('What would you do if a customer leaves more than half of the product?', 1),
        yna('How do you handle a customer asking for extra protein in a salad?', 1),
        yna('What do you do if a customer is angry or irritated?', 1),
        yna('What would you do if a customer complains about cold food/coffee?', 1),
        yna('How do you manage service if the wrong item (veg/non-veg) is served?', 1),
        yna('What do you do if a customer sits for a long time post meal?', 1),
      ],
    },
    {
      title: 'Customer Experience',
      questions: [
        yna('Is background music at appropriate volume?', 1),
        yna('Is store temperature comfortable?', 1),
        yna('Are washrooms clean and well-maintained?', 1),
        yna('Is Wi-Fi available & functioning properly?', 1),
        yna('Are marketing & Visual Merchandise displays correct?', 2),
        yna('Is store furniture clean & well-kept?', 1),
        yna('What do you understand by MA, CPI, QA scores?', 1),
        yna('What was the latest Mystery Audit score for the store?', 1),
        yna('Top 2 CX opportunity areas last month?', 1),
      ],
    },
    {
      title: 'Action Plan & Continuous Improvement',
      questions: [
        yna('Concerns addressed within 48hrs?', 1, -1),
        yna('Action points closed/work-in-progress?', 2),
        yna('Managers aware of action plan?', 2),
      ],
    },
  ],
};

// ══════════════════════════════════════════════════════════════
//  PROGRAM 5: HR Connect Survey
// ══════════════════════════════════════════════════════════════
const hrConnect: P = {
  name: 'HR Connect Survey',
  description: 'Employee engagement and well-being survey conducted during HR store visits. Covers work pressure, empowerment, feedback, collaboration, and overall satisfaction.',
  type: ProgramType.CUSTOM,
  department: 'HR',
  scoringEnabled: true,
  sections: [
    {
      title: 'HR Connect Questions',
      questions: [
        scored('Is there any work pressure in the café?', [
          { label: 'Every time', score: 1 }, { label: 'Most of the time', score: 2 }, { label: 'Sometime', score: 3 }, { label: 'At Time', score: 4 }, { label: 'Never', score: 5 },
        ]),
        scored('Are you empowered to make decisions on the spot to help customers and immediately solve their problems/complaints?', [
          { label: 'Every time', score: 5 }, { label: 'Most of the time', score: 4 }, { label: 'Sometime', score: 3 }, { label: 'At Time', score: 2 }, { label: 'Never', score: 1 },
        ]),
        scored('Do you receive regular performance reviews and constructive feedback from your SM / AM?', [
          { label: 'Every time', score: 5 }, { label: 'Most of the time', score: 4 }, { label: 'Sometime', score: 3 }, { label: 'At Time', score: 2 }, { label: 'Never', score: 1 },
        ]),
        scored('Do you think there is any partiality or unfair treatment within team?', [
          { label: 'Every time', score: 1 }, { label: 'Most of the time', score: 2 }, { label: 'Sometime', score: 3 }, { label: 'At Time', score: 4 }, { label: 'Never', score: 5 },
        ]),
        scored('Are you getting the training as per Wings program? What was the last training you got and when?', [
          { label: 'Every time', score: 5 }, { label: 'Most of the time', score: 4 }, { label: 'Sometime', score: 3 }, { label: 'At Time', score: 2 }, { label: 'Never', score: 1 },
        ]),
        scored('Are you facing any issues with operational Apps (Zing, Meal benefit, Jify) or any issues with PF, ESI, Reimbursements, Insurance & Payslips?', [
          { label: 'Every time', score: 1 }, { label: 'Most of the time', score: 2 }, { label: 'Sometime', score: 3 }, { label: 'At Time', score: 4 }, { label: 'Never', score: 5 },
        ]),
        scored('Have you gone through the HR Handbook on Zing / Accepted all the policies?', [
          { label: 'Excellent', score: 5 }, { label: 'Very Good', score: 4 }, { label: 'Good', score: 3 }, { label: 'Average', score: 2 }, { label: 'Poor', score: 1 },
        ]),
        scored('Are you satisfied with your current work schedule - Working Hours, Breaks, Timings, Weekly Offs & Comp Offs?', [
          { label: 'Every time', score: 5 }, { label: 'Most of the time', score: 4 }, { label: 'Sometime', score: 3 }, { label: 'At Time', score: 2 }, { label: 'Never', score: 1 },
        ]),
        scored('How effectively does the team collaborate, and what factors contribute to that?', [
          { label: 'Excellent', score: 5 }, { label: 'Very Good', score: 4 }, { label: 'Good', score: 3 }, { label: 'Average', score: 2 }, { label: 'Poor', score: 1 },
        ]),
        txt('Name one of your colleague who is very helpful on the floor'),
        txt('Any suggestions or support required from the organization?'),
        scored('On a scale of 1 to 5 how do you rate your experience with TWC & why?', [
          { label: 'Excellent', score: 5 }, { label: 'Very Good', score: 4 }, { label: 'Good', score: 3 }, { label: 'Average', score: 2 }, { label: 'Poor', score: 1 },
        ]),
      ],
    },
  ],
};

// ══════════════════════════════════════════════════════════════
//  PROGRAM 6: SHLP Assessment (Shift Leader Performance)
// ══════════════════════════════════════════════════════════════
const SHLP_NEGATIVE = ['0', '1', '2'];
const SHLP_POSITIVE = ['0', '1', '2', '+2 (Exceptional)'];
const SHLP_DEFAULT = ['0', '1', '2'];

function shlpQ(text: string, scoringType: 'negative' | 'positive' | 'default'): Q {
  if (scoringType === 'negative') return { text, questionType: QuestionType.YES_NO, weight: 2, negativeWeight: -2 };
  if (scoringType === 'positive') return { text, questionType: QuestionType.DROPDOWN, weight: 4, options: SHLP_POSITIVE };
  return { text, questionType: QuestionType.DROPDOWN, weight: 2, options: SHLP_DEFAULT };
}

// SHLP scoring maps: negative=[1,2,3,5,11,13,15,23], positive=[20,28,34]
const NEG_IDS = [1,2,3,5,11,13,15,23];
const POS_IDS = [20,28,34];
function shlpType(itemNum: number): 'negative' | 'positive' | 'default' {
  if (NEG_IDS.includes(itemNum)) return 'negative';
  if (POS_IDS.includes(itemNum)) return 'positive';
  return 'default';
}

const shlpAssessment: P = {
  name: 'SHLP Assessment',
  description: 'Shift Leader Habitual Performance assessment covering store readiness, product quality, cash handling, team management, operations, safety, and business acumen.',
  type: ProgramType.TRAINING_ASSESSMENT,
  department: 'Training',
  scoringEnabled: true,
  sections: [
    {
      title: 'Store Readiness',
      questions: [
        shlpQ('Complete Opening, Mid, and Closing checklists', shlpType(1)),
        shlpQ('Ensure store readiness before opening', shlpType(2)),
        shlpQ('Check VM of food case & merchandise wall (stocked and fixed)', shlpType(3)),
        shlpQ('Ensure marketing & promotional collaterals are correctly displayed', shlpType(4)),
      ],
    },
    {
      title: 'Product Quality & Standards',
      questions: [
        shlpQ('Conduct dial-in checks for coffee & food', shlpType(5)),
        shlpQ('Do not allow sub-standard products to be served', shlpType(6)),
        shlpQ('Ensure recipes, SOPs, and standards are followed', shlpType(7)),
        shlpQ('Understand impact on COGS, wastage & variances', shlpType(8)),
        shlpQ('Ensure sampling activation & coffee tasting', shlpType(9)),
      ],
    },
    {
      title: 'Cash & Administration',
      questions: [
        shlpQ('Check petty cash, float & safe amount', shlpType(10)),
        shlpQ('Fill cash log book for handover', shlpType(11)),
        shlpQ('Arrange float/change for POS', shlpType(12)),
        shlpQ('Complete GRN & petty cash entries', shlpType(13)),
        shlpQ('Follow ordering flow/schedule', shlpType(14)),
      ],
    },
    {
      title: 'Team Management',
      questions: [
        shlpQ('Conduct team briefing (updates, promotions, grooming)', shlpType(15)),
        shlpQ('Communicate shift goals & targets', shlpType(16)),
        shlpQ('Motivate team to follow TWC standards', shlpType(17)),
        shlpQ('Plan team breaks effectively', shlpType(18)),
        shlpQ('Identify bottlenecks & support team (C.O.F.F.E.E, LEAST, R.O.A.S.T and clearing station blockages)', shlpType(19)),
        shlpQ('Recognize top performers', shlpType(20)),
        shlpQ('Provide task-specific feedback to partners', shlpType(21)),
        shlpQ('Share performance inputs with Store Manager', shlpType(22)),
      ],
    },
    {
      title: 'Operations & Availability',
      questions: [
        shlpQ('Monitor product availability & update team', shlpType(23)),
        shlpQ('Utilize lean periods for training & coaching', shlpType(24)),
        shlpQ('Utilize peak periods for customer experience & business', shlpType(25)),
        shlpQ('Adjust deployment based on shift need', shlpType(26)),
        shlpQ('Adjust shift priorities as required', shlpType(27)),
        shlpQ('Follow receiving, storing & thawing guidelines', shlpType(28)),
        shlpQ('Remove thawing products as per schedule', shlpType(29)),
      ],
    },
    {
      title: 'Safety & Compliance',
      questions: [
        shlpQ('Follow key handling process and proactively hands over in case going on leave or weekly off', shlpType(30)),
        shlpQ('Follow Lost & Found SOP', shlpType(31)),
        shlpQ('Log maintenance issues', shlpType(32)),
      ],
    },
    {
      title: 'Shift Closing',
      questions: [
        shlpQ('Complete all closing tasks thoroughly', shlpType(33)),
      ],
    },
    {
      title: 'Business Acumen',
      questions: [
        shlpQ('Is able to do Shift Performance analysis (PSA) like LTO, LA, IPS, ADS, AOV drivers, CPI, MA, QA Etc. & has BSC understanding', shlpType(34)),
        shlpQ('Check and keep the record of EB Units as per their shift', shlpType(35)),
      ],
    },
  ],
};

// ══════════════════════════════════════════════════════════════
//  PROGRAM 7: Brew League AM Round
// ══════════════════════════════════════════════════════════════
const brewLeagueAM: P = {
  name: 'Brew League - AM Round',
  description: 'Barista championship competition scorecard for Area Manager level. Covers grooming, espresso dial-in, milk-based beverages, and sensory evaluation.',
  type: ProgramType.COMPETITION_SCORING,
  department: 'Training',
  scoringEnabled: true,
  imageUploadEnabled: true,
  sections: [
    { title: 'Grooming & Hygiene', questions: groomingQuestions() },
    { title: 'Espresso Dial-In Shot 1', questions: espressoDialInShot() },
    { title: 'Espresso Dial-In Shot 2', questions: espressoDialInShot() },
    { title: 'Cup-1 Steaming', questions: milkSteaming() },
    { title: 'Cup-1 Pouring', questions: cupPouringAM() },
    { title: 'Cup-2 Steaming', questions: milkSteaming() },
    { title: 'Cup-2 Pouring', questions: cupPouringAM() },
    {
      title: 'Sensory Score',
      questions: [
        ynw('Was the Latte art created as per TWC std (Cappuccino-Heart, Latte-Tulip/Rosetta, Flat white-Single dot)', 5),
        ynw('Was it shiny and glossy?', 3),
        ynw('No visible bubbles on the surface', 3),
        ynw('Is the latte art in the centre of the cup', 3),
        ynw('Is there a visible contrast between the crema and the latte art', 3),
        ynw('Is the latte art facing the customer with the handle on the right side', 5),
        ynw('Did the latte art cover 70% of the cup surface', 3),
        ynw('Was the froth level present as per TWC standard (Three Swipes-cappuccino, Two Swipes-Latte & One swipe-Flatwhite)', 4),
        ynw('Was the froth ratio as per TWC standard (70/30 cappuccino, 90/10 latte, micro foam flat white)', 5),
        ynw('Did the barista smile and have an engaging interaction with the judge', 3),
        ynw('Did the barista leave the counter clean after finishing his/her performance', 3),
      ],
    },
  ],
};

// ══════════════════════════════════════════════════════════════
//  PROGRAM 8: Brew League Region Round
// ══════════════════════════════════════════════════════════════
const brewLeagueRegion: P = {
  name: 'Brew League - Region Round',
  description: 'Regional barista championship scorecard. Expanded format with 3 cups, detailed extraction, steaming, pouring, and sensory sheets.',
  type: ProgramType.COMPETITION_SCORING,
  department: 'Training',
  scoringEnabled: true,
  imageUploadEnabled: true,
  sections: [
    { title: 'Grooming & Hygiene', questions: groomingQuestions() },
    { title: 'Espresso Dial-In Shot 1', questions: espressoDialInShot() },
    { title: 'Espresso Dial-In Shot 2', questions: espressoDialInShot() },
    { title: 'Cup-1 Extraction', questions: cupExtraction(true) },
    { title: 'Cup-1 Steaming', questions: milkSteaming() },
    { title: 'Cup-1 Pouring', questions: cupPouringRegion() },
    { title: 'Cup-2 Extraction', questions: cupExtraction(false) },
    {
      title: 'Cup-2 Steaming',
      questions: [
        ynw('Is the barista able to explain the milk steaming process', 2),
        ...milkSteaming(),
      ],
    },
    { title: 'Cup-2 Pouring', questions: cupPouringRegion() },
    { title: 'Cup-3 Extraction', questions: cupExtraction(true) },
    { title: 'Cup-3 Steaming', questions: milkSteaming() },
    { title: 'Cup-3 Pouring', questions: cupPouringRegion() },
    {
      title: 'Overall',
      questions: [
        ynw('Did the barista clean the counter before completing his/her routine', 5),
      ],
    },
    {
      title: 'Sensory Sheet',
      description: 'Separate sensory evaluation scorecard for the Region Round.',
      questions: [
        ynw('Was the Latte art created as per TWC std (Cappuccino-Heart, Latte-Tulip/Rosetta, Flat white-Single dot)', 5),
        ynw('Was it shiny and glossy?', 3),
        ynw('No visible bubbles on the surface', 3),
        ynw('Is the latte art in the centre of the cup', 3),
        ynw('Is there a visible contrast between the crema and the latte art', 3),
        ynw('Is the latte art facing the customer with the handle on the right side', 5),
        ynw('Did the latte art cover 70% of the cup surface', 3),
        ynw('Was the froth level present as per TWC standard (Three Swipes-cappuccino, Two Swipes-Latte & One swipe-Flatwhite)', 4),
        ynw('Did the barista smile and have an engaging interaction with the judge', 3),
        ynw('Did the barista leave the counter clean after finishing his/her performance', 3),
      ],
    },
  ],
};

// ══════════════════════════════════════════════════════════════
//  PROGRAM 9: Bench Planning — BT Level (Barista to Buddy Trainer)
// ══════════════════════════════════════════════════════════════
function readinessQ(text: string): Q {
  return {
    text,
    questionType: QuestionType.RATING_SCALE,
    weight: 5,
    ratingScale: { min: 1, max: 5, labels: { '1': 'Needs Development', '2': 'Below Average', '3': 'Average', '4': 'Good', '5': 'Excellent' } },
  };
}

function interviewQ(competency: string): Q {
  return {
    text: `Rate the candidate on: ${competency}`,
    questionType: QuestionType.RATING_SCALE,
    weight: 5,
    ratingScale: { min: 1, max: 5, labels: { '1': 'Poor', '2': 'Below Average', '3': 'Average', '4': 'Good', '5': 'Excellent' } },
  };
}

const benchPlanningBT: P = {
  name: 'Bench Planning — BT Level',
  description: 'Barista to Buddy Trainer assessment. Three-stage process: Manager readiness checklist, 15-question MCQ assessment, and panel interview on 7 core competencies.',
  type: ProgramType.TRAINING_ASSESSMENT,
  department: 'Training',
  scoringEnabled: true,
  scoringConfig: { passingScore: 60, scoreDisplay: 'percentage' },
  sections: [
    {
      title: 'Readiness Checklist',
      description: 'Manager evaluates candidate readiness on a 1-5 scale.',
      questions: [
        readinessQ('Has completed all product and process knowledge modules on LMS.'),
        readinessQ('Demonstrates strong understanding of SOPs and stays updated with any changes in process or communication.'),
        readinessQ('Has completed the Food Safety module in LMS and consistently applies standards, correcting others when needed.'),
        readinessQ('Maintains punctuality and regular attendance.'),
        readinessQ('Consistently maintains high personal grooming and hygiene standards, setting an example for others.'),
        readinessQ('Proactively leads pre-shift huddles and supports in store training (e.g., during LTO rollouts, communication etc).'),
        readinessQ('Takes initiative to support store operations beyond assigned tasks.'),
        readinessQ('Shows positive influence and motivates team members during service.'),
        readinessQ('Has experience in coaching or mentoring new team members.'),
        readinessQ('Can independently manage short shifts with minimal supervision.'),
        readinessQ('Handles guest concerns or complaints calmly and confidently.'),
      ],
    },
    {
      title: 'MCQ Assessment',
      description: '15-question multiple-choice assessment for BT level candidates.',
      questions: [
        mcq('Which statement reflects true leadership in a café?', { A: '"I support the team, step in, and debrief."', B: '"I take the toughest tasks."', C: '"I handle escalations only."', D: '"I stick to my scope."' }, 'A'),
        mcq('The café sold 200 cups of coffee. Each cup costs ₹140, with a 25% profit margin. What was the profit?', { A: '₹6,800', B: '₹7,000', C: '₹7,200', D: '₹6,500' }, 'B'),
        mcq('You spot a team member skipping an SOP step. How do you address it?', { A: 'File written warning', B: 'Ignore it this time', C: 'Give 1:1 feedback and demonstrate', D: 'Call out loudly in front of guests' }, 'C'),
        mcq('A long pickup queue is forming; service is slowing. Most effective move?', { A: 'Ask guests to be patient', B: 'Stop dine-in orders', C: 'Add floater to pickup/expedite', D: 'Wait for queue to shrink' }, 'C'),
        mcq('Team member X at POS for 4 hours without a break, and café is busy. Best action?', { A: '"That\'s rush life"', B: 'Tell X to slip out when they can', C: '"Hold till rush ends."', D: 'Arrange cover, give X a break, then rotate.' }, 'D'),
        mcq('Total sales: ₹9,200. Cash counted: ₹9,000. What is the discrepancy and possible reason?', { A: '₹150 short; incorrect product pricing', B: '₹200 excess; card payment logged as cash', C: '₹200 short; wrong discount applied', D: '₹200 short; unbilled order or theft' }, 'D'),
        mcq('Find the next number in the series: 7, 14, 28, 56, ___', { A: '84', B: '112', C: '98', D: '70' }, 'B'),
        mcq('A café uses 7 L of milk per day. If a 12% increase in customers is expected next week, how much milk should be ordered for a 7-day week?', { A: '55L', B: '57.5L', C: '56L', D: '54.9L' }, 'D'),
        mcq('With 5 team members and 3 peak hours, how would you deploy resources to avoid bottlenecks?', { A: 'Use only 1 per peak hour', B: 'All 5 to one peak hour', C: '2 in first peak, 1 each in remaining two', D: '2 to first, 2 to second, 1 to third peak' }, 'D'),
        mcq('If 3% of the monthly coffee stock is wasted and the stock is worth ₹18,000, calculate the wastage cost.', { A: '₹450', B: '₹720', C: '₹600', D: '₹540' }, 'D'),
        mcq('Customer waiting, order delayed, team busy. What should be your first response?', { A: '"It\'ll be out soon."', B: '"Someone else handle this."', C: '"Please wait; we\'re busy."', D: '"I\'m sorry... let me check the status."' }, 'D'),
        mcq("What's the right priority order during operations?", { A: 'Team → Cost → Customer', B: 'Customer → Cost → Team', C: 'Customer → Team → Cost', D: 'Cost → Team → Customer' }, 'C'),
        mcq("A guest says their Americano tastes too bitter. What's the best course of action?", { A: 'Apologize, remake, and check dial-in', B: 'Say it\'s standard', C: 'Blame grinder settings', D: 'Offer refund immediately' }, 'A'),
        mcq('A (POS), B (Espresso), C (Cold bar/clean-downs). Rush in 15 mins. Who takes a break now?', { A: 'B', B: 'C', C: 'None of the above', D: 'A' }, 'B'),
        mcq('Oat milk stocks are low and may not last till the next delivery. What do you do?', { A: 'Mix with dairy', B: 'Use less milk to stretch stock', C: 'Hope it lasts', D: 'Inform manager, off/limit SKU, suggest alternatives' }, 'D'),
      ],
    },
    {
      title: 'Panel Interview',
      description: 'Panel interview evaluation across 7 core competencies. Each competency scored 1-5.',
      questions: [
        interviewQ('Responsibility'),
        interviewQ('Empathy'),
        interviewQ('Service Excellence'),
        interviewQ('Performance with Purpose'),
        interviewQ('Ethics and Integrity'),
        interviewQ('Collaboration'),
        interviewQ('Trust'),
      ],
    },
  ],
};

// ══════════════════════════════════════════════════════════════
//  PROGRAM 10: Bench Planning — SM/ASM Level
// ══════════════════════════════════════════════════════════════
const benchPlanningSMASM: P = {
  name: 'Bench Planning — SM to ASM Level',
  description: 'Store Manager to Assistant Store Manager assessment. Three-stage process: readiness checklist, 20-question MCQ assessment, and panel interview.',
  type: ProgramType.TRAINING_ASSESSMENT,
  department: 'Training',
  scoringEnabled: true,
  scoringConfig: { passingScore: 60, scoreDisplay: 'percentage' },
  sections: [
    {
      title: 'Readiness Checklist',
      description: 'Manager evaluates candidate readiness on a 1-5 scale.',
      questions: [
        readinessQ('Has successfully managed full shifts independently with consistent quality standards'),
        readinessQ('Demonstrates strong leadership in coaching and developing team members'),
        readinessQ('Shows consistent ability to handle peak hours and complex operational challenges'),
        readinessQ('Has completed all advanced training modules including P&L basics and inventory management'),
        readinessQ('Exhibits strong problem-solving skills and decision-making capabilities'),
        readinessQ('Maintains excellent communication with store team, AM, and support functions'),
        readinessQ('Shows initiative in driving store performance metrics (sales, quality, guest satisfaction)'),
        readinessQ('Has experience managing conflict resolution and challenging guest situations'),
        readinessQ('Demonstrates understanding of cost control, wastage management, and labour scheduling'),
        readinessQ('Can open and close the store independently following all protocols'),
        readinessQ('Shows commitment to TWC values and acts as a role model for the team'),
      ],
    },
    {
      title: 'MCQ Assessment',
      description: '20-question assessment for SM to ASM level candidates.',
      questions: [
        mcq("Last month's total sales were ₹5,50,000. This month it dropped by 10%. What are this month's sales?", { A: '₹4,95,000', B: '₹4,85,000', C: '₹5,25,000', D: '₹5,00,000' }, 'A'),
        mcq("You have ₹1,20,000 as your monthly budget for inventory. You've already spent ₹86,000. How much balance remains?", { A: '₹36,000', B: '₹38,000', C: '₹34,000', D: '₹40,000' }, 'C'),
        mcq('The cost of making one beverage is ₹55, and it is sold at ₹130. What is the profit margin per drink?', { A: '₹65', B: '₹75', C: '₹85', D: '₹95' }, 'B'),
        mcq("Your store's target is ₹6,00,000. You've achieved ₹4,20,000 in 20 days. What's the required daily average for the remaining 10 days?", { A: '₹15,000', B: '₹18,000', C: '₹20,000', D: '₹22,000' }, 'B'),
        mcq('Your average daily sales are ₹18,000. Your gross margin is 60%. What is your approximate monthly gross profit (30 days)?', { A: '₹3,00,000', B: '₹3,60,000', C: '₹3,24,000', D: '₹4,20,000' }, 'C'),
        mcq("A beverage's ingredient cost is ₹35. If wastage is 8% and spoilage loss is 5%, what is the adjusted cost per beverage?", { A: '₹37.50', B: '₹38.85', C: '₹40.25', D: '₹41.20' }, 'D'),
        mcq("A barista makes an error in a drink three times in one shift. What's your first response?", { A: 'Issue warning letter', B: 'Ignore – busy shift', C: 'Observe and retrain', D: 'Replace them on shift' }, 'C'),
        mcq('If A is faster than B, B is faster than C, but C is most accurate, whom do you schedule during a high-accuracy order window?', { A: 'A', B: 'C', C: 'B', D: 'A and C' }, 'B'),
        mcq('You need 5 staff to manage the floor, but one has called in sick. What do you do first?', { A: 'Call backup staff', B: 'Reduce service area', C: 'Skip Breaks', D: 'Do nothing' }, 'A'),
        mcq('A customer orders 4 beverages, but the system only bills for 3. What do you do?', { A: 'Let it go', B: 'Inform customer and add item', C: 'Adjust from another order', D: 'Pay difference yourself' }, 'B'),
        mcq('You have to reduce 10 labor hours per week while maintaining service. Which solution is most efficient?', { A: "Reduce each staff\'s shift by 30 minutes", B: 'Remove one low traffic shift/lean shift entirely', C: 'Shorten peak hours', D: 'Cut breaks' }, 'B'),
        mcq('A system generates the following pattern of sales increase: 5%, 10%, 15%, 20%… What would be the % increase in the 6th week?', { A: '30%', B: '35%', C: '40%', D: '25%' }, 'D'),
        mcq("During peak time, your POS system crashes. What's your action?", { A: 'Stop service', B: 'Use manual billing after informing the AM', C: 'Wait for IT', D: 'Inform customers and close the store' }, 'B'),
        mcq("You're promoted over a peer who expected the role. They're demotivated and disengaging. You:", { A: 'Assign fewer responsibilities', B: 'Address it 1:1, acknowledge the situation, and re-engage', C: 'Let them cool off on their own', D: 'Involve HR directly' }, 'B'),
        mcq("You are asked to lead two new stores temporarily, but your own store is under-staffed. What's your approach?", { A: 'Delegate internally and develop one team member as acting lead', B: 'Decline the opportunity', C: 'Ask for external support', D: 'Take it on and manage all yourself' }, 'A'),
        mcq('How often should you appreciate your team?', { A: 'Only for major achievements', B: 'Rarely', C: 'Publicly and often for small wins', D: 'Once a month' }, 'C'),
        mcq('Your team consistently meets targets, but morale is low. You:', { A: 'Celebrate small wins', B: 'Increase targets', C: 'Let them continue', D: 'Avoid change' }, 'A'),
        mcq("You've received a customer complaint on social media about rude service. What is your priority?", { A: 'Delete the comment', B: 'Apologize publicly and take it offline', C: 'Privately message the customer', D: 'Give discount on next visit' }, 'B'),
        mcq('A delivery vendor is late for the third time in a week, impacting morning prep. What\'s the ideal response?', { A: 'Cancel the vendor immediately', B: 'Apologize publicly and take it offline', C: 'Raise an SLA concern and request urgent resolution', D: 'Accept and move on' }, 'C'),
        mcq('You observe shortcuts being taken during cleaning. You:', { A: 'Suspend team', B: 'Inform area manager', C: 'Coach the team', D: 'Ignore — it\'s minor' }, 'C'),
      ],
    },
    {
      title: 'Panel Interview',
      description: 'Panel interview evaluation across 7 core competencies.',
      questions: [
        interviewQ('Responsibility'),
        interviewQ('Empathy'),
        interviewQ('Service Excellence'),
        interviewQ('Performance with Purpose'),
        interviewQ('Ethics and Integrity'),
        interviewQ('Collaboration'),
        interviewQ('Trust'),
      ],
    },
  ],
};

// ══════════════════════════════════════════════════════════════
//  PROGRAM 11: Campus Hiring Assessment
// ══════════════════════════════════════════════════════════════
const campusHiring: P = {
  name: 'Campus Hiring Assessment',
  description: 'Timed 30-minute MCQ assessment for campus hiring candidates. 30 questions across 6 categories: Psychometric, English Proficiency, Numerical Aptitude, Logical Reasoning, Analytical Aptitude, Course Curriculum.',
  type: ProgramType.CAMPUS_HIRING,
  department: 'HR',
  scoringEnabled: true,
  timerDuration: 1800, // 30 minutes in seconds
  scoringConfig: { timerDuration: 1800, proctoringEnabled: true, scoreDisplay: 'percentage' },
  sections: [
    {
      title: 'Psychometric',
      questions: [
        wmcq("Imagine you're explaining a new drink recipe to a teammate whose first language isn't English. You:", { A: { text: 'Repeat exactly what was told to you', weight: 1 }, B: { text: 'Try to explain in simple words and gestures', weight: 2 }, C: { text: "Ask them what part they didn't understand and explain accordingly", weight: 3 } }),
        wmcq('A drink consistently tastes off. You:', { A: { text: 'Remake it and hope it improves next time', weight: 1 }, B: { text: 'Try adjusting the grind or recipe slightly', weight: 2 }, C: { text: 'Document the issue and escalate it to the trainer', weight: 3 } }),
        wmcq("Your team isn't following the cleaning checklist. You:", { A: { text: 'Do it yourself without mentioning it', weight: 1 }, B: { text: 'Remind them casually', weight: 2 }, C: { text: 'Call a short huddle and reinforce expectations', weight: 3 } }),
        wmcq('A customer says their drink tastes "strange." You:', { A: { text: 'Say sorry and move on', weight: 1 }, B: { text: 'Offer to remake it once', weight: 2 }, C: { text: 'Ask specifics and tailor a solution', weight: 3 } }),
        wmcq('You find a wallet on the café floor. You:', { A: { text: 'Leave it at the counter', weight: 1 }, B: { text: 'Keep it safe and note the time', weight: 2 }, C: { text: 'Record it and report to shift lead', weight: 3 } }),
      ],
    },
    {
      title: 'English Proficiency',
      questions: [
        wmcq('Which sentence is grammatically correct?', { A: { text: 'The team are working hard.', weight: 1 }, B: { text: 'The team is working hard.', weight: 3 }, C: { text: 'The team were working hard.', weight: 2 } }),
        wmcq('Choose the correctly spelled word:', { A: { text: 'Occured', weight: 1 }, B: { text: 'Ocurred', weight: 1 }, C: { text: 'Occurred', weight: 3 } }),
        wmcq('Select the sentence with proper punctuation:', { A: { text: "Let's eat, Grandma!", weight: 3 }, B: { text: 'Lets eat Grandma!', weight: 1 }, C: { text: "Let's eat Grandma!", weight: 1 } }),
        wmcq('What is the meaning of "proactive"?', { A: { text: 'Reacting after something happens', weight: 1 }, B: { text: 'Taking action in advance', weight: 3 }, C: { text: 'Being professional', weight: 1 } }),
        wmcq('Complete the sentence: "Neither the manager ___ the team members were present."', { A: { text: 'or', weight: 1 }, B: { text: 'nor', weight: 3 }, C: { text: 'and', weight: 1 } }),
      ],
    },
    {
      title: 'Numerical Aptitude',
      questions: [
        wmcq('A cook uses a mixture where the ratio of flour to sugar is (x+2):(x–1). If the mixture weighs 21 kg and sugar is 6 kg, find x.', { A: { text: '1', weight: 1 }, B: { text: '2', weight: 1 }, C: { text: '3', weight: 1 }, D: { text: '4', weight: 3 } }),
        wmcq('A hotel invests ₹20,000 at 10% compound interest, compounded annually for 3 years. Amount earned?', { A: { text: '₹24,200', weight: 1 }, B: { text: '₹26,620', weight: 3 }, C: { text: '₹26,000', weight: 1 }, D: { text: '₹27,300', weight: 1 } }),
        wmcq('40% of the guests ordered breakfast. If there were 300 guests, how many ordered breakfast?', { A: { text: '100', weight: 1 }, B: { text: '120', weight: 3 }, C: { text: '140', weight: 1 }, D: { text: '160', weight: 1 } }),
        wmcq('A dish costs ₹250 to prepare and is sold at 20% profit. Selling price?', { A: { text: '₹270', weight: 1 }, B: { text: '₹275', weight: 1 }, C: { text: '₹300', weight: 3 }, D: { text: '₹320', weight: 1 } }),
        wmcq('Two waiters can set 30 tables in 3 hours. How many tables can one waiter set in 2 hours?', { A: { text: '5', weight: 1 }, B: { text: '10', weight: 3 }, C: { text: '15', weight: 1 }, D: { text: '20', weight: 1 } }),
      ],
    },
    {
      title: 'Logical Reasoning',
      questions: [
        wmcq('Circular Seating: Six guests A,B,C,D,E,F sit around a table. B sits second to the right of A. E is not adjacent to B. C sits opposite A. F is to the immediate left of C. Who sits to the immediate right of D?', { A: { text: 'A', weight: 1 }, B: { text: 'B', weight: 1 }, C: { text: 'E', weight: 3 }, D: { text: 'F', weight: 1 } }),
        wmcq('Hotel Room Puzzle: Q not in 101/102. R in odd room. S next to Q. P not in 104. Where does R stay?', { A: { text: '101', weight: 1 }, B: { text: '103', weight: 3 }, C: { text: '104', weight: 1 }, D: { text: 'Cannot be determined', weight: 1 } }),
        wmcq('Syllogism: All chefs are trained. Some trained are management grads. No grad is untrained. I: Some chefs may be grads. II: No chef is untrained. Which follows?', { A: { text: 'Only I follows', weight: 1 }, B: { text: 'Only II follows', weight: 1 }, C: { text: 'Both I and II follow', weight: 3 }, D: { text: 'Neither follows', weight: 1 } }),
        wmcq('Coding: SERVICE → TFWVJHK. How is QUALITY coded?', { A: { text: 'RVCPNKZ', weight: 3 }, B: { text: 'RVDQMJZ', weight: 1 }, C: { text: 'RBENLJX', weight: 1 }, D: { text: 'RVCOLKZ', weight: 1 } }),
        wmcq('Direction Sense: A steward walks 6m north, 8m east, 6m south. How far from start?', { A: { text: '4m', weight: 3 }, B: { text: '6m', weight: 1 }, C: { text: '8m', weight: 1 }, D: { text: '10m', weight: 1 } }),
      ],
    },
    {
      title: 'Analytical Aptitude',
      questions: [
        wmcq('Aditya walked 15m south, right turn 3m, right turn 15m stopped. Direction facing?', { A: { text: 'East', weight: 1 }, B: { text: 'West', weight: 1 }, C: { text: 'North', weight: 3 }, D: { text: 'South', weight: 1 } }),
        wmcq('A bag contains Rs.30 in 50p, Rs.1 and Rs.2 coins in ratio 4:2:1. How many 50p coins?', { A: { text: '20', weight: 3 }, B: { text: '10', weight: 1 }, C: { text: '5', weight: 1 }, D: { text: '15', weight: 1 } }),
        wmcq('Shopkeeper selling at 7% loss. Sold for Rs.800 more → 9% profit. Find CP.', { A: { text: '500', weight: 1 }, B: { text: '4000', weight: 1 }, C: { text: '6000', weight: 1 }, D: { text: '5000', weight: 3 } }),
        wmcq('Find the number of triangles in the given figure.', { A: { text: '8', weight: 1 }, B: { text: '10', weight: 1 }, C: { text: '12', weight: 1 }, D: { text: '14', weight: 3 } }),
        wmcq('Count the number of triangles and squares in the given figure.', { A: { text: '36 triangles, 7 squares', weight: 1 }, B: { text: '38 triangles, 9 squares', weight: 1 }, C: { text: '40 triangles, 7 squares', weight: 3 }, D: { text: '42 triangles, 9 squares', weight: 1 } }),
      ],
    },
    {
      title: 'Course Curriculum',
      questions: [
        wmcq('What falls in the danger zone?', { A: { text: '1-5 degree Celsius', weight: 1 }, B: { text: '22-58 degree Celsius', weight: 3 }, C: { text: '65-80 degree Celsius', weight: 1 }, D: { text: '2-4 degree Celsius', weight: 1 } }),
        wmcq('The two parts of HACCP include:', { A: { text: 'Hazard analysis and critical control points', weight: 3 }, B: { text: 'Health analysis and critical control points', weight: 1 }, C: { text: 'Hazard analysis and critical conformation production', weight: 1 }, D: { text: 'Health analysis and critical conformation production', weight: 1 } }),
        wmcq('What is The Third Wave Movement of coffee about?', { A: { text: 'Bean to cup', weight: 3 }, B: { text: 'Flavoured coffee', weight: 1 }, C: { text: 'Farm to cup', weight: 1 }, D: { text: 'Monetization of coffee', weight: 1 } }),
        wmcq('Which ISO standard is applicable for the QSR industry?', { A: { text: 'ISO 9001', weight: 3 }, B: { text: 'ISO 22001', weight: 1 }, C: { text: 'ISO 22000', weight: 1 }, D: { text: 'ISO 27001', weight: 1 } }),
        wmcq('Which of these is not a type of contamination?', { A: { text: 'Biological contamination', weight: 1 }, B: { text: 'Chemical contamination', weight: 1 }, C: { text: 'Physical contamination', weight: 1 }, D: { text: 'Social contamination', weight: 3 } }),
      ],
    },
  ],
};

// ══════════════════════════════════════════════════════════════
//  PROGRAM 12: MT Feedback Form
// ══════════════════════════════════════════════════════════════
const mtFeedback: P = {
  name: 'Management Trainee Feedback Form',
  description: 'Formal MT feedback with weighted scoring across key learning and workplace dimensions.',
  type: ProgramType.CUSTOM,
  department: 'Training',
  scoringEnabled: true,
  scoringConfig: { scoreDisplay: 'percentage', weightedSections: true },
  sections: [
    {
      title: 'Overall Experience',
      weight: 15,
      questions: [
        likert('Rate your overall learning experience during the Management Trainee (MT) journey.', 15),
      ],
    },
    {
      title: 'Training Effectiveness',
      weight: 25,
      questions: [
        likert('The training content and delivery (classroom and on-ground) effectively built my understanding of café operations.', 10),
        likert('The LMS modules were easy to access, engaging, and supported my overall learning.', 10),
        likert('The training structure provided adequate practice time and opportunities to reflect on learning.', 5),
      ],
    },
    {
      title: 'Trainer & On-Ground Support',
      weight: 25,
      questions: [
        likert('My trainer provided clear guidance, timely feedback, and consistent support throughout my training.', 10),
        likert('My Store Manager ensured structured learning opportunities and clarity of expectations.', 7),
        likert('My Area Manager was approachable and provided adequate guidance during my training journey.', 8),
      ],
    },
    {
      title: 'Workplace Culture & Environment',
      weight: 15,
      questions: [
        likert('I felt respected, included, and supported in the workplace during my training.', 7),
        likert("I understand Third Wave Coffee's culture, values, and vision, and I feel motivated to build a long-term career here.", 8),
      ],
    },
    {
      title: 'Application & Readiness',
      weight: 20,
      questions: [
        likert('I feel confident applying what I learned during the Buddy Trainer course in my café.', 12),
        likert('I have had sufficient opportunities to apply my learning in real café situations.', 8),
      ],
    },
    {
      title: 'Open Feedback',
      weight: 0,
      questions: [
        txt('What suggestions would you like to share to improve the Management Trainee training experience?'),
        txt('How can your manager or team better support you in applying this training?'),
        txt('Were there any topics you wish had been covered in greater depth?'),
        txt('What aspects of the training could be improved?'),
        txt('Did the training and experience meet your expectations throughout your journey as a Barista and Buddy Trainer? Please explain.'),
      ],
    },
  ],
};

// ══════════════════════════════════════════════════════════════
//  IMPORT FUNCTION
// ══════════════════════════════════════════════════════════════

const ALL_PROGRAMS: P[] = [
  operationsAudit,
  qaAudit,
  financeAudit,
  trainingAssessment,
  hrConnect,
  shlpAssessment,
  brewLeagueAM,
  brewLeagueRegion,
  benchPlanningBT,
  benchPlanningSMASM,
  campusHiring,
  mtFeedback,
];

async function importAll() {
  console.log(`\n🚀 Importing ${ALL_PROGRAMS.length} programs into Prism Platform...\n`);

  let totalSections = 0;
  let totalQuestions = 0;

  // Collect all IDs we'll be creating so we can clean up first
  const programIds = ALL_PROGRAMS.map(p => uuid(`program:${p.name}`));

  // Phase 1: Delete existing data in reverse order (responses → questions → sections → programs)
  console.log('  🧹 Cleaning existing imported data...');
  // Delete responses that reference our questions first
  await prisma.programResponse.deleteMany({
    where: { question: { section: { program: { id: { in: programIds } } } } },
  });
  // Also delete submissions that reference our programs
  await prisma.programSubmission.deleteMany({
    where: { programId: { in: programIds } },
  });
  await prisma.programQuestion.deleteMany({
    where: { section: { program: { id: { in: programIds } } } },
  });
  await prisma.programSection.deleteMany({
    where: { program: { id: { in: programIds } } },
  });
  await prisma.program.deleteMany({
    where: { id: { in: programIds } },
  });

  // Phase 2: Create all programs
  for (const prog of ALL_PROGRAMS) {
    const programId = uuid(`program:${prog.name}`);

    await prisma.program.create({
      data: {
        id: programId,
        companyId: COMPANY_ID,
        name: prog.name,
        description: prog.description || null,
        type: prog.type,
        department: prog.department || null,
        status: prog.status || ProgramStatus.ACTIVE,
        scoringEnabled: prog.scoringEnabled ?? true,
        signatureEnabled: prog.signatureEnabled ?? false,
        imageUploadEnabled: prog.imageUploadEnabled ?? true,
        timerDuration: prog.timerDuration || null,
        scoringConfig: prog.scoringConfig || {},
      },
    });

    // Create all sections for this program
    const sectionRows = prog.sections.map((sec, si) => ({
      id: uuid(`section:${prog.name}:${si}:${sec.title}`),
      programId,
      title: sec.title,
      description: sec.description || null,
      order: si,
      weight: sec.weight ?? 1.0,
      isCritical: sec.isCritical ?? false,
      maxScore: sec.maxScore || null,
    }));

    await prisma.programSection.createMany({ data: sectionRows });
    totalSections += sectionRows.length;

    // Create all questions for all sections in one batch
    const questionRows: any[] = [];
    for (let si = 0; si < prog.sections.length; si++) {
      const sec = prog.sections[si];
      const sectionId = uuid(`section:${prog.name}:${si}:${sec.title}`);

      for (let qi = 0; qi < sec.questions.length; qi++) {
        const q = sec.questions[qi];
        questionRows.push({
          id: uuid(`question:${prog.name}:${si}:${sec.title}:${qi}:${q.text.slice(0, 50)}`),
          sectionId,
          questionType: q.questionType,
          text: q.text,
          description: q.description || null,
          order: qi,
          weight: q.weight ?? 1.0,
          negativeWeight: q.negativeWeight || null,
          correctAnswer: q.correctAnswer || null,
          scoringEnabled: q.scoringEnabled ?? true,
          required: q.required ?? false,
          options: q.options || [],
          ratingScale: q.ratingScale || null,
          allowImages: q.allowImages ?? false,
          allowComments: q.allowComments ?? false,
        });
      }
    }

    // Batch insert questions (chunk into groups of 100 for safety)
    for (let i = 0; i < questionRows.length; i += 100) {
      const chunk = questionRows.slice(i, i + 100);
      await prisma.programQuestion.createMany({ data: chunk });
    }
    totalQuestions += questionRows.length;

    console.log(`  ✅ Program: ${prog.name} (${sectionRows.length} sections, ${questionRows.length} questions)`);
  }

  console.log(`\n✨ Import complete!`);
  console.log(`   Programs:  ${ALL_PROGRAMS.length}`);
  console.log(`   Sections:  ${totalSections}`);
  console.log(`   Questions: ${totalQuestions}\n`);
}

// ── Run ──
importAll()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Import failed:', e);
    prisma.$disconnect();
    process.exit(1);
  });
