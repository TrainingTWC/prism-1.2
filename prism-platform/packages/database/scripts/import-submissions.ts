// ════════════════════════════════════════════════════════════════
//  Prism Platform — Submission Import Script
// ════════════════════════════════════════════════════════════════
//
//  Imports historical submission data from 5 CSV exports into:
//    ProgramSubmission + ProgramResponse tables
//
//  Also creates real TWC Stores & Employees as needed.
//
//  Usage:
//    cd packages/database
//    npx tsx scripts/import-submissions.ts
//
//  This script is IDEMPOTENT — safe to run multiple times.
//  Uses deterministic UUIDs so re-runs update rather than duplicate.
//
// ════════════════════════════════════════════════════════════════

import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { createHash } from 'crypto';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();
const COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const DATA_DIR = join(__dirname, '..', 'data', 'submissions');

// ── Deterministic UUID ──
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

// ── Region lookup ──
const REGION_MAP: Record<string, string> = {
  north: '00000000-0000-0000-0000-000000000050',
  south: '00000000-0000-0000-0000-000000000051',
  west: '00000000-0000-0000-0000-000000000052',
  central: '00000000-0000-0000-0000-000000000053',
};

const DEFAULT_ROLE_ID = '00000000-0000-0000-0000-000000000012'; // user role
const DEFAULT_PASSWORD_HASH = '$2b$10$placeholder_hash_for_imported_employees';

// ════════════════════════════════════════════════════════════════
//  PHASE 1: Parse all CSVs
// ════════════════════════════════════════════════════════════════

function readCSV(filename: string): Record<string, string>[] {
  console.log(`  Reading ${filename}...`);
  const raw = readFileSync(join(DATA_DIR, filename), 'utf-8');
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    relax_quotes: true,
  });
  console.log(`    → ${records.length} rows`);
  return records;
}

// ════════════════════════════════════════════════════════════════
//  PHASE 2: Collect and create Stores & Employees
// ════════════════════════════════════════════════════════════════

interface StoreInfo {
  code: string;
  name: string;
  region: string;
}
interface EmployeeInfo {
  empId: string;
  name: string;
}

function extractStoreCode(val: string): string {
  // Handle "S119", "S045", etc.
  return val.trim().toUpperCase();
}

function collectStoresAndEmployees(
  opsRows: Record<string, string>[],
  hrRows: Record<string, string>[],
  shlpRows: Record<string, string>[],
  campusRows: Record<string, string>[],
  trainingRows: Record<string, string>[],
) {
  const stores = new Map<string, StoreInfo>();
  const employees = new Map<string, EmployeeInfo>();

  // Operations Audit
  for (const r of opsRows) {
    const code = extractStoreCode(r['Store ID'] || '');
    if (code) stores.set(code, { code, name: r['Store Name'] || code, region: (r['Region'] || '').toLowerCase() });
    // HR person is the auditor
    const hrId = (r['HR ID'] || '').trim();
    if (hrId) employees.set(hrId, { empId: hrId, name: (r['HR Name'] || hrId).trim() });
    // AM
    const amId = (r['AM ID'] || '').trim();
    if (amId) employees.set(amId, { empId: amId, name: (r['AM Name'] || amId).trim() });
    // Trainer
    const tId = (r['Trainer ID'] || '').trim();
    if (tId) employees.set(tId, { empId: tId, name: (r['Trainer Name'] || tId).trim() });
  }

  // HR Connect
  for (const r of hrRows) {
    const code = extractStoreCode(r['Store ID'] || '');
    if (code) stores.set(code, { code, name: r['Store Name'] || code, region: (r['Region'] || '').toLowerCase() });
    const hrId = (r['HR ID'] || '').trim();
    if (hrId) employees.set(hrId, { empId: hrId, name: (r['HR Name'] || hrId).trim() });
    const amId = (r['AM ID'] || '').trim();
    if (amId) employees.set(amId, { empId: amId, name: (r['AM Name'] || amId).trim() });
    const empId = (r['Emp ID'] || '').trim();
    if (empId) employees.set(empId, { empId: empId, name: (r['Emp Name'] || empId).trim() });
  }

  // SHLP Assessment
  for (const r of shlpRows) {
    const code = extractStoreCode(r['Store'] || '');
    if (code) stores.set(code, { code, name: code, region: '' }); // SHLP has no region/store name column
    const empId = (r['Employee ID'] || '').trim();
    if (empId) employees.set(empId, { empId: empId, name: (r['Employee Name'] || empId).trim() });
    // Auditor — has name but may not have ID, use name as ID
    const auditorName = (r['Auditor Name'] || '').trim();
    if (auditorName) {
      const auditorId = 'AUD-' + auditorName.toUpperCase().replace(/\s+/g, '-');
      employees.set(auditorId, { empId: auditorId, name: auditorName });
    }
    // Area Manager
    const amId = (r['Area Manager'] || '').trim();
    if (amId) employees.set(amId, { empId: amId, name: (r['Area Manager Name'] || amId).trim() });
    // Trainer
    const tId = (r['Trainer'] || '').trim();
    if (tId) employees.set(tId, { empId: tId, name: (r['Trainer Names'] || tId).trim() });
  }

  // Campus Hiring — no store, just candidates (create as employees for tracking)
  // Create a virtual "Campus Recruitment" store
  stores.set('CAMPUS', { code: 'CAMPUS', name: 'Campus Recruitment (Virtual)', region: '' });
  // Create a system user for campus submissions
  employees.set('SYSTEM', { empId: 'SYSTEM', name: 'System (Auto-Import)' });
  for (const r of campusRows) {
    const phone = (r['Candidate Phone'] || '').trim();
    const name = (r['Candidate Name'] || '').trim();
    if (phone) {
      const candidateId = 'CAND-' + phone;
      employees.set(candidateId, { empId: candidateId, name: name || candidateId });
    }
  }

  // Training Assessment
  for (const r of trainingRows) {
    const code = extractStoreCode(r['Store ID'] || '');
    if (code) stores.set(code, { code, name: r['Store Name'] || code, region: (r['Region'] || '').toLowerCase() });
    const tId = (r['Trainer ID'] || '').trim();
    if (tId) employees.set(tId, { empId: tId, name: (r['Trainer Name'] || tId).trim() });
    const amId = (r['AM ID'] || '').trim();
    if (amId) employees.set(amId, { empId: amId, name: (r['AM Name'] || amId).trim() });
    // Auditor (at the end of CSV)
    const audId = (r['Auditor ID'] || '').trim();
    if (audId) employees.set(audId, { empId: audId, name: (r['Auditor Name'] || audId).trim() });
  }

  return { stores, employees };
}

async function createStoresAndEmployees(
  stores: Map<string, StoreInfo>,
  employees: Map<string, EmployeeInfo>,
) {
  console.log(`\n══ Creating ${stores.size} stores ══`);

  // Delete old imported stores (keep seed stores with code starting with NYC/LA/CHI/MIA)
  // Actually, let's just upsert all stores

  const storeIdMap = new Map<string, string>(); // code → uuid

  for (const [code, info] of stores) {
    const storeId = uuid(`store-${COMPANY_ID}-${code}`);
    storeIdMap.set(code, storeId);
    const regionId = REGION_MAP[info.region] || null;

    await prisma.store.upsert({
      where: { id: storeId },
      create: {
        id: storeId,
        companyId: COMPANY_ID,
        storeCode: code,
        storeName: info.name,
        city: info.region ? info.region.charAt(0).toUpperCase() + info.region.slice(1) : 'Unknown',
        regionId,
      },
      update: {
        storeName: info.name,
        regionId: regionId || undefined,
      },
    });
  }
  console.log(`  ✓ ${storeIdMap.size} stores upserted`);

  console.log(`\n══ Creating ${employees.size} employees ══`);

  const empIdMap = new Map<string, string>(); // empCode → uuid

  for (const [empCode, info] of employees) {
    const employeeId = uuid(`employee-${COMPANY_ID}-${empCode}`);
    empIdMap.set(empCode, employeeId);

    // Generate a unique email using the deterministic UUID to avoid collisions
    const emailHash = createHash('md5').update(empCode).digest('hex').slice(0, 8);
    const emailSafe = empCode.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `${emailSafe}-${emailHash}@twc-import.local`;

    await prisma.employee.upsert({
      where: { id: employeeId },
      create: {
        id: employeeId,
        companyId: COMPANY_ID,
        empId: empCode,
        name: info.name,
        email,
        passwordHash: DEFAULT_PASSWORD_HASH,
        roleId: DEFAULT_ROLE_ID,
      },
      update: {
        name: info.name,
      },
    });
  }
  console.log(`  ✓ ${empIdMap.size} employees upserted`);

  return { storeIdMap, empIdMap };
}

// ════════════════════════════════════════════════════════════════
//  PHASE 3: Load question mapping from DB
// ════════════════════════════════════════════════════════════════

interface ProgramData {
  id: string;
  sections: {
    id: string;
    order: number;
    name: string;
    questions: { id: string; order: number; text: string }[];
  }[];
}

async function loadProgramData(): Promise<{
  opsAudit: ProgramData;
  hrConnect: ProgramData;
  shlp: ProgramData;
  campus: ProgramData;
  training: ProgramData;
}> {
  const programs = await prisma.program.findMany({
    where: {
      id: {
        in: [
          '80457773-31c4-4642-8b91-fc74e419ce73', // Operations Audit
          '819ba2b8-b920-49dd-8a70-709dc37028f5', // HR Connect Survey
          '9e0dffef-abb7-4c81-85b4-4921e977b335', // SHLP Assessment
          'b18a0d8f-4dca-42ac-811d-e3f4bf047908', // Campus Hiring Assessment
          'ba5d46c5-405f-4924-8cd1-11c5ffdd1c00', // Training Assessment
        ],
      },
    },
    include: {
      sections: {
        include: { questions: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      },
    },
  });

  const byId = new Map(programs.map((p) => [p.id, p as unknown as ProgramData]));

  return {
    opsAudit: byId.get('80457773-31c4-4642-8b91-fc74e419ce73')!,
    hrConnect: byId.get('819ba2b8-b920-49dd-8a70-709dc37028f5')!,
    shlp: byId.get('9e0dffef-abb7-4c81-85b4-4921e977b335')!,
    campus: byId.get('b18a0d8f-4dca-42ac-811d-e3f4bf047908')!,
    training: byId.get('ba5d46c5-405f-4924-8cd1-11c5ffdd1c00')!,
  };
}

// ════════════════════════════════════════════════════════════════
//  PHASE 4: Import Submissions per CSV
// ════════════════════════════════════════════════════════════════

function parseDate(val: string): Date | null {
  if (!val) return null;
  // Handle formats: "2/13/2026 12:27:53", "2026-02-13T06:57:51.475Z", "25/09/2025, 17:15:11", "24/11/2025 11:51:53"
  try {
    // ISO format
    if (val.includes('T')) return new Date(val);
    // "M/D/YYYY HH:mm:ss" or "DD/MM/YYYY, HH:mm:ss"
    const cleaned = val.replace(',', '').trim();
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d;
    // Try DD/MM/YYYY format
    const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(.*)/);
    if (match) {
      const [_, d1, d2, yr, time] = match;
      // If first number > 12, it's DD/MM
      if (parseInt(d1) > 12) {
        return new Date(`${yr}-${d2.padStart(2, '0')}-${d1.padStart(2, '0')}T${time.trim()}`);
      }
      return new Date(`${yr}-${d1.padStart(2, '0')}-${d2.padStart(2, '0')}T${time.trim()}`);
    }
    return null;
  } catch {
    return null;
  }
}

function parseFloat_(val: string): number | null {
  if (!val || val === '' || val === 'NA' || val === 'na' || val === 'N/A') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function parseBool(val: string): boolean | null {
  const v = (val || '').toLowerCase().trim();
  if (v === 'yes' || v === 'true' || v === '1') return true;
  if (v === 'no' || v === 'false' || v === '0') return false;
  return null; // na, empty, etc.
}

// ────────────────────────────────────────
//  Operations Audit
// ────────────────────────────────────────
async function importOperationsAudit(
  rows: Record<string, string>[],
  program: ProgramData,
  storeIdMap: Map<string, string>,
  empIdMap: Map<string, string>,
) {
  console.log(`\n══ Importing Operations Audit (${rows.length} rows) ══`);

  // Build column → question ID mapping
  // Section 0: CG_1..CG_13 → questions[0..12]
  // Section 1: OTA_101..OTA_111 → questions[0..10]
  // Section 2: FAS_201..FAS_213 → questions[0..12]
  // Section 3: FWS_301..FWS_313 → questions[0..12]
  // Section 4: ENJ_401..ENJ_407 → questions[0..6]
  // Section 5: EX_501..EX_506 → questions[0..5]
  const columnMap: { csvCol: string; questionId: string; sectionIdx: number }[] = [];

  // CG section
  for (let i = 1; i <= 13; i++) {
    columnMap.push({ csvCol: `CG_${i}`, questionId: program.sections[0].questions[i - 1].id, sectionIdx: 0 });
  }
  // OTA section
  for (let i = 101; i <= 111; i++) {
    columnMap.push({ csvCol: `OTA_${i}`, questionId: program.sections[1].questions[i - 101].id, sectionIdx: 1 });
  }
  // FAS section
  for (let i = 201; i <= 213; i++) {
    columnMap.push({ csvCol: `FAS_${i}`, questionId: program.sections[2].questions[i - 201].id, sectionIdx: 2 });
  }
  // FWS section
  for (let i = 301; i <= 313; i++) {
    columnMap.push({ csvCol: `FWS_${i}`, questionId: program.sections[3].questions[i - 301].id, sectionIdx: 3 });
  }
  // ENJ section
  for (let i = 401; i <= 407; i++) {
    columnMap.push({ csvCol: `ENJ_${i}`, questionId: program.sections[4].questions[i - 401].id, sectionIdx: 4 });
  }
  // EX section
  for (let i = 501; i <= 506; i++) {
    columnMap.push({ csvCol: `EX_${i}`, questionId: program.sections[5].questions[i - 501].id, sectionIdx: 5 });
  }

  const sectionScoreColumns = ['CG_Score', 'OTA_Score', 'FAS_Score', 'FWS_Score', 'ENJ_Score', 'EX_Score'];
  const sectionNames = ['Cheerful Greeting', 'Order Taking', 'Friendly & Accurate Service', 'Feedback with Solution', 'Enjoyable Experience', 'Enthusiastic Exit'];

  let created = 0;
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const r = rows[rowIdx];
    const storeCode = extractStoreCode(r['Store ID'] || '');
    const storeId = storeIdMap.get(storeCode);
    const hrId = (r['HR ID'] || '').trim();
    const employeeId = empIdMap.get(hrId);
    if (!storeId || !employeeId) {
      console.log(`    ⚠ Skipping row ${rowIdx}: missing store (${storeCode}) or employee (${hrId})`);
      continue;
    }

    const submittedAt = parseDate(r['Submission Time'] || r['Server Timestamp'] || '');
    const submissionId = uuid(`ops-submission-${rowIdx}-${storeCode}-${hrId}-${r['Submission Time'] || rowIdx}`);

    // Section scores
    const sectionScores = sectionScoreColumns.map((col, idx) => ({
      sectionId: program.sections[idx].id,
      sectionName: sectionNames[idx],
      score: parseFloat_(r[col]),
    }));

    // Upsert submission
    await prisma.programSubmission.upsert({
      where: { id: submissionId },
      create: {
        id: submissionId,
        programId: program.id,
        employeeId,
        storeId,
        status: SubmissionStatus.COMPLETED,
        score: parseFloat_(r['Total Score']),
        maxScore: parseFloat_(r['Max Score']),
        percentage: parseFloat_(r['Percentage Score']),
        sectionScores: JSON.stringify(sectionScores),
        startedAt: submittedAt,
        submittedAt,
      },
      update: {
        score: parseFloat_(r['Total Score']),
        maxScore: parseFloat_(r['Max Score']),
        percentage: parseFloat_(r['Percentage Score']),
        sectionScores: JSON.stringify(sectionScores),
      },
    });

    // Delete old responses for this submission
    await prisma.programResponse.deleteMany({ where: { submissionId } });

    // Create responses
    const responses = columnMap
      .map((cm) => {
        const val = (r[cm.csvCol] || '').trim();
        if (!val) return null;
        const boolVal = parseBool(val);
        return {
          id: uuid(`ops-response-${submissionId}-${cm.questionId}`),
          submissionId,
          questionId: cm.questionId,
          answer: val,
          booleanValue: boolVal,
          score: boolVal === true ? 1.0 : 0.0,
          maxScore: 1.0,
        };
      })
      .filter(Boolean) as any[];

    if (responses.length > 0) {
      await prisma.programResponse.createMany({ data: responses });
    }
    created++;
  }
  console.log(`  ✓ ${created} Operations Audit submissions imported`);
}

// ────────────────────────────────────────
//  HR Connect
// ────────────────────────────────────────
async function importHRConnect(
  rows: Record<string, string>[],
  program: ProgramData,
  storeIdMap: Map<string, string>,
  empIdMap: Map<string, string>,
) {
  console.log(`\n══ Importing HR Connect (${rows.length} rows) ══`);

  // CSV: Q1..Q12 map to section 0 questions 0..11
  // CSV column names include text after "Qn - ..."
  const qColumns = [
    'Q1 - Work Pressure in Café',
    'Q2 - Decision Making & Customer Problem Solving',
    'Q3 - Performance Reviews & SM/AM Feedback',
    'Q4 - Team Treatment & Partiality',
    'Q5 - Wings Program Training',
    'Q6 - Operational Apps & Benefits Issues',
    'Q7 - HR Handbook & Policies',
    'Q8 - Work Schedule Satisfaction',
    'Q9 - Team Collaboration',
    'Q10 - Helpful Colleague',
    'Q11 - Suggestions for Organization',
    'Q12 - TWC Experience Rating',
  ];
  const remarkColumns = [
    'Q1 Remarks', 'Q2 Remarks', 'Q3 Remarks', 'Q4 Remarks',
    'Q5 Remarks', 'Q6 Remarks', 'Q7 Remarks', 'Q8 Remarks',
    'Q9 Remarks', 'Q10 Remarks', 'Q11 Remarks', 'Q12 Remarks',
  ];

  const questions = program.sections[0].questions; // 12 questions in single section

  // Likert scoring: Every time=5, Most of the time=4, Sometime=3, Rarely=2, Never=1, Very Good=5, Good=4, Average=3, Poor=2, Very Poor=1
  const LIKERT: Record<string, number> = {
    'every time': 5, 'most of the time': 4, 'sometime': 3, 'sometimes': 3,
    'rarely': 2, 'never': 1,
    'very good': 5, 'good': 4, 'average': 3, 'poor': 2, 'very poor': 1,
    'excellent': 5, 'satisfied': 4, 'neutral': 3, 'unsatisfied': 2, 'dissatisfied': 1,
    '5': 5, '4': 4, '3': 3, '2': 2, '1': 1,
  };

  let created = 0;
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const r = rows[rowIdx];
    const storeCode = extractStoreCode(r['Store ID'] || '');
    const storeId = storeIdMap.get(storeCode);
    const hrId = (r['HR ID'] || '').trim();
    const employeeId = empIdMap.get(hrId);
    if (!storeId || !employeeId) {
      console.log(`    ⚠ Skipping row ${rowIdx}: missing store (${storeCode}) or employee (${hrId})`);
      continue;
    }

    const submittedAt = parseDate(r['Submission Time'] || r['Server Timestamp'] || '');
    const empId = (r['Emp ID'] || '').trim();
    const submissionId = uuid(`hr-submission-${rowIdx}-${storeCode}-${hrId}-${empId}-${r['Submission Time'] || rowIdx}`);

    await prisma.programSubmission.upsert({
      where: { id: submissionId },
      create: {
        id: submissionId,
        programId: program.id,
        employeeId,
        storeId,
        status: SubmissionStatus.COMPLETED,
        score: parseFloat_(r['Total Score']),
        maxScore: parseFloat_(r['Max Score']),
        percentage: parseFloat_(r['Percent']),
        sectionScores: '[]',
        startedAt: submittedAt,
        submittedAt,
      },
      update: {
        score: parseFloat_(r['Total Score']),
        maxScore: parseFloat_(r['Max Score']),
        percentage: parseFloat_(r['Percent']),
      },
    });

    await prisma.programResponse.deleteMany({ where: { submissionId } });

    const responses: any[] = [];
    for (let qi = 0; qi < qColumns.length && qi < questions.length; qi++) {
      const val = (r[qColumns[qi]] || '').trim();
      if (!val) continue;
      const remark = (r[remarkColumns[qi]] || '').trim();
      const numericVal = LIKERT[val.toLowerCase()] ?? null;

      responses.push({
        id: uuid(`hr-response-${submissionId}-${questions[qi].id}`),
        submissionId,
        questionId: questions[qi].id,
        answer: val,
        numericValue: numericVal,
        score: numericVal,
        maxScore: 5.0, // Likert scale max
        comment: remark || null,
      });
    }

    if (responses.length > 0) {
      await prisma.programResponse.createMany({ data: responses });
    }
    created++;
  }
  console.log(`  ✓ ${created} HR Connect submissions imported`);
}

// ────────────────────────────────────────
//  SHLP Assessment
// ────────────────────────────────────────
async function importSHLP(
  rows: Record<string, string>[],
  program: ProgramData,
  storeIdMap: Map<string, string>,
  empIdMap: Map<string, string>,
) {
  console.log(`\n══ Importing SHLP Assessment (${rows.length} rows) ══`);

  // SHLP_1..SHLP_35 map sequentially across 8 sections:
  // Section 0 (Store Readiness, 4 Qs): SHLP_1..4
  // Section 1 (Product Quality, 5 Qs): SHLP_5..9
  // Section 2 (Cash & Admin, 5 Qs): SHLP_10..14
  // Section 3 (Team Management, 8 Qs): SHLP_15..22
  // Section 4 (Operations, 7 Qs): SHLP_23..29
  // Section 5 (Safety, 3 Qs): SHLP_30..32
  // Section 6 (Shift Closing, 1 Q): SHLP_33
  // Section 7 (Business, 2 Qs): SHLP_34..35

  // Build flat mapping: SHLP_n → question ID
  const questionMap: { csvCol: string; remarkCol: string; questionId: string; sectionIdx: number }[] = [];
  let qNum = 1;
  for (let sIdx = 0; sIdx < program.sections.length; sIdx++) {
    for (let qIdx = 0; qIdx < program.sections[sIdx].questions.length; qIdx++) {
      questionMap.push({
        csvCol: `SHLP_${qNum}`,
        remarkCol: `SHLP_${qNum}_remarks`,
        questionId: program.sections[sIdx].questions[qIdx].id,
        sectionIdx: sIdx,
      });
      qNum++;
    }
  }

  const sectionScoreColumns = [
    'Store_Readiness_Score', 'Product_Quality_Score', 'Cash_Admin_Score',
    'Team_Management_Score', 'Operations_Score', 'Safety_Score',
    'Shift_Closing_Score', 'Business_Score',
  ];
  const sectionNames = [
    'Store Readiness', 'Product Quality', 'Cash & Admin',
    'Team Management', 'Operations', 'Safety',
    'Shift Closing', 'Business',
  ];

  let created = 0;
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const r = rows[rowIdx];
    const storeCode = extractStoreCode(r['Store'] || '');
    const storeId = storeIdMap.get(storeCode);

    // Auditor is the submitter
    const auditorName = (r['Auditor Name'] || '').trim();
    let auditorEmpKey = auditorName ? 'AUD-' + auditorName.toUpperCase().replace(/\s+/g, '-') : '';
    const employeeId = empIdMap.get(auditorEmpKey);

    if (!storeId || !employeeId) {
      console.log(`    ⚠ Skipping row ${rowIdx}: missing store (${storeCode}) or employee (${auditorEmpKey})`);
      continue;
    }

    const submittedAt = parseDate(r['Submission Time'] || r['Server Timestamp'] || '');
    const assessedEmpId = (r['Employee ID'] || '').trim();
    const submissionId = uuid(`shlp-submission-${rowIdx}-${storeCode}-${assessedEmpId}-${r['Submission Time'] || rowIdx}`);

    const sectionScores = sectionScoreColumns.map((col, idx) => ({
      sectionId: program.sections[idx]?.id,
      sectionName: sectionNames[idx],
      score: parseFloat_(r[col]),
    }));

    await prisma.programSubmission.upsert({
      where: { id: submissionId },
      create: {
        id: submissionId,
        programId: program.id,
        employeeId,
        storeId,
        status: SubmissionStatus.COMPLETED,
        score: parseFloat_(r['Overall_Score']),
        maxScore: 100,
        percentage: parseFloat_(r['Overall_Percentage']),
        sectionScores: JSON.stringify(sectionScores),
        startedAt: submittedAt,
        submittedAt,
      },
      update: {
        score: parseFloat_(r['Overall_Score']),
        percentage: parseFloat_(r['Overall_Percentage']),
        sectionScores: JSON.stringify(sectionScores),
      },
    });

    await prisma.programResponse.deleteMany({ where: { submissionId } });

    const responses: any[] = [];
    for (const qm of questionMap) {
      const val = (r[qm.csvCol] || '').trim();
      if (!val) continue;
      const remark = (r[qm.remarkCol] || '').trim();

      // Values: Yes/No → boolean, 0/1/2 → numeric
      const boolVal = parseBool(val);
      const numVal = parseFloat_(val);

      responses.push({
        id: uuid(`shlp-response-${submissionId}-${qm.questionId}`),
        submissionId,
        questionId: qm.questionId,
        answer: val,
        booleanValue: boolVal,
        numericValue: boolVal === null ? numVal : null,
        score: boolVal === true ? 2.0 : boolVal === false ? 0.0 : numVal,
        maxScore: 2.0,
        comment: remark || null,
      });
    }

    if (responses.length > 0) {
      await prisma.programResponse.createMany({ data: responses });
    }
    created++;
  }
  console.log(`  ✓ ${created} SHLP Assessment submissions imported`);
}

// ────────────────────────────────────────
//  Campus Hiring Assessment
// ────────────────────────────────────────
async function importCampusHiring(
  rows: Record<string, string>[],
  program: ProgramData,
  storeIdMap: Map<string, string>,
  empIdMap: Map<string, string>,
) {
  console.log(`\n══ Importing Campus Hiring (${rows.length} rows) ══`);

  // Q1..Q30 across 6 sections (5 Qs each)
  // Section 0 (Psychometric): Q1-5
  // Section 1 (English): Q6-10
  // Section 2 (Numerical): Q11-15
  // Section 3 (Logical): Q16-20
  // Section 4 (Analytical): Q21-25
  // Section 5 (Course Curriculum): Q26-30

  // CSV columns: "Q1: Psychometric", "Q1 Weight", "Q2: Psychometric", etc.
  const sectionLabels = [
    'Psychometric', 'English Proficiency', 'Numerical Aptitude',
    'Logical Reasoning', 'Analytical Aptitude', 'Course Curriculum',
  ];
  const sectionScoreColumns = [
    'Psychometric Score %', 'English Proficiency Score %', 'Numerical Aptitude Score %',
    'Logical Reasoning Score %', 'Analytical Aptitude Score %', 'Course Curriculum Score %',
  ];

  const campusStoreId = storeIdMap.get('CAMPUS')!;
  const systemEmpId = empIdMap.get('SYSTEM')!;

  let created = 0;
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const r = rows[rowIdx];

    const phone = (r['Candidate Phone'] || '').trim();
    const candidateName = (r['Candidate Name'] || '').trim();
    const campusName = (r['Campus Name'] || '').trim();

    const submittedAt = parseDate(r['Submission Time'] || r['Timestamp'] || '');
    const submissionId = uuid(`campus-submission-${rowIdx}-${phone}-${r['Submission Time'] || rowIdx}`);

    const sectionScores = sectionScoreColumns.map((col, idx) => ({
      sectionId: program.sections[idx]?.id,
      sectionName: sectionLabels[idx],
      score: parseFloat_(r[col]),
    }));

    // Store candidate metadata in sectionScores
    const metadata = {
      candidateName,
      candidatePhone: phone,
      candidateEmail: (r['Candidate Email'] || '').trim(),
      campusName,
      proctoringEnabled: r['Proctoring Enabled'] || '',
      totalViolations: r['Total Violations'] || '',
    };

    await prisma.programSubmission.upsert({
      where: { id: submissionId },
      create: {
        id: submissionId,
        programId: program.id,
        employeeId: systemEmpId,
        storeId: campusStoreId,
        status: SubmissionStatus.COMPLETED,
        score: parseFloat_(r['Total Score']),
        maxScore: parseFloat_(r['Max Score']),
        percentage: parseFloat_(r['Score Percentage']),
        sectionScores: JSON.stringify({ sections: sectionScores, meta: metadata }),
        startedAt: submittedAt,
        submittedAt,
      },
      update: {
        score: parseFloat_(r['Total Score']),
        maxScore: parseFloat_(r['Max Score']),
        percentage: parseFloat_(r['Score Percentage']),
        sectionScores: JSON.stringify({ sections: sectionScores, meta: metadata }),
      },
    });

    await prisma.programResponse.deleteMany({ where: { submissionId } });

    const responses: any[] = [];
    for (let qNum = 1; qNum <= 30; qNum++) {
      // Find the CSV column. Column names are like "Q1: Psychometric"
      const sectionIdx = Math.floor((qNum - 1) / 5);
      const qIdxInSection = (qNum - 1) % 5;
      const label = sectionLabels[sectionIdx];
      const csvCol = `Q${qNum}: ${label}`;
      const weightCol = `Q${qNum} Weight`;

      const val = (r[csvCol] || '').trim();
      if (!val) continue;
      const weight = parseFloat_(r[weightCol]) ?? 0;
      const questionId = program.sections[sectionIdx]?.questions[qIdxInSection]?.id;
      if (!questionId) continue;

      responses.push({
        id: uuid(`campus-response-${submissionId}-${questionId}`),
        submissionId,
        questionId,
        answer: val, // A, B, C, D
        numericValue: weight,
        score: weight,
        maxScore: 3.0, // Max weight is 3
      });
    }

    if (responses.length > 0) {
      await prisma.programResponse.createMany({ data: responses });
    }
    created++;
  }
  console.log(`  ✓ ${created} Campus Hiring submissions imported`);
}

// ────────────────────────────────────────
//  Training Assessment
// ────────────────────────────────────────
async function importTrainingAssessment(
  rows: Record<string, string>[],
  program: ProgramData,
  storeIdMap: Map<string, string>,
  empIdMap: Map<string, string>,
) {
  console.log(`\n══ Importing Training Assessment (${rows.length} rows) ══`);

  // CSV sections map to DB sections:
  // TM_1..9 → Section 0 (Training Material, 9 Qs)
  // LMS_1..3 → Section 1 (LMS, 3 Qs)
  // Buddy_1..6 → Section 2 (Buddy, 6 Qs)
  // NJ_1..7 → Section 3 (New Joiner, 7 Qs)
  // PK_1..7 → Section 4 (Product Knowledge, 7 Qs)
  // TSA_1..3 → Section 5 (TSA Food Safety, 3 Qs) — mapped as aggregate scores
  // CX_1..9 → Section 16 (CX Ambience, 9 Qs)
  // AP_1..3 → Section 17 (Action Points, 3 Qs)

  // Build mapping: csv prefix + number → question ID
  const csvSections = [
    { prefix: 'TM', count: 9, dbSectionIdx: 0 },
    { prefix: 'LMS', count: 3, dbSectionIdx: 1 },
    { prefix: 'Buddy', count: 6, dbSectionIdx: 2 },
    { prefix: 'NJ', count: 7, dbSectionIdx: 3 },
    { prefix: 'PK', count: 7, dbSectionIdx: 4 },
    // TSA_1..3 are aggregate scores, will be handled separately
    { prefix: 'CX', count: 9, dbSectionIdx: 16 },
    { prefix: 'AP', count: 3, dbSectionIdx: 17 },
  ];

  const questionMap: { csvCol: string; questionId: string; prefix: string }[] = [];
  for (const cs of csvSections) {
    const section = program.sections[cs.dbSectionIdx];
    if (!section) {
      console.log(`    ⚠ DB section ${cs.dbSectionIdx} not found for ${cs.prefix}`);
      continue;
    }
    for (let i = 1; i <= cs.count; i++) {
      const q = section.questions[i - 1];
      if (!q) {
        console.log(`    ⚠ Question ${cs.prefix}_${i} has no matching DB question in section ${cs.dbSectionIdx}`);
        continue;
      }
      questionMap.push({
        csvCol: `${cs.prefix}_${i}`,
        questionId: q.id,
        prefix: cs.prefix,
      });
    }
  }

  const remarkCols = ['TM_remarks', 'LMS_remarks', 'Buddy_remarks', 'NJ_remarks', 'PK_remarks', 'CX_remarks', 'AP_remarks', 'TSA_Food_remarks', 'TSA_Coffee_remarks', 'TSA_CX_remarks'];

  let created = 0;
  let skipped = 0;

  // Process in batches to avoid memory issues
  const BATCH_SIZE = 50;
  for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
    const batch = rows.slice(batchStart, batchStart + BATCH_SIZE);

    for (let i = 0; i < batch.length; i++) {
      const rowIdx = batchStart + i;
      const r = batch[i];

      const storeCode = extractStoreCode(r['Store ID'] || '');
      const storeId = storeIdMap.get(storeCode);
      const trainerId = (r['Trainer ID'] || '').trim();
      const employeeId = empIdMap.get(trainerId);

      if (!storeId || !employeeId) {
        skipped++;
        continue;
      }

      const submittedAt = parseDate(r['Submission Time'] || r['Server Timestamp'] || '');
      const submissionId = uuid(`training-submission-${rowIdx}-${storeCode}-${trainerId}-${r['Submission Time'] || rowIdx}`);

      // TSA aggregate scores
      const tsaFoodScore = parseFloat_(r['TSA_1']);
      const tsaCoffeeScore = parseFloat_(r['TSA_2']);
      const tsaCXScore = parseFloat_(r['TSA_3']);

      // Collect all remarks
      const remarks: Record<string, string> = {};
      for (const col of remarkCols) {
        const val = (r[col] || '').trim();
        if (val) remarks[col] = val;
      }

      const sectionScores = [
        { section: 'Training Material', score: null as number | null },
        { section: 'LMS', score: null as number | null },
        { section: 'Buddy Training', score: null as number | null },
        { section: 'New Joiner', score: null as number | null },
        { section: 'Product Knowledge', score: null as number | null },
        { section: 'TSA - Food', score: tsaFoodScore },
        { section: 'TSA - Coffee', score: tsaCoffeeScore },
        { section: 'TSA - CX', score: tsaCXScore },
        { section: 'CX Ambience', score: null as number | null },
        { section: 'Action Points', score: null as number | null },
      ];

      await prisma.programSubmission.upsert({
        where: { id: submissionId },
        create: {
          id: submissionId,
          programId: program.id,
          employeeId,
          storeId,
          status: SubmissionStatus.COMPLETED,
          score: parseFloat_(r['Total Score']),
          maxScore: parseFloat_(r['Max Score']),
          percentage: parseFloat_(r['Percentage']),
          sectionScores: JSON.stringify({ sections: sectionScores, remarks }),
          startedAt: submittedAt,
          submittedAt,
        },
        update: {
          score: parseFloat_(r['Total Score']),
          maxScore: parseFloat_(r['Max Score']),
          percentage: parseFloat_(r['Percentage']),
          sectionScores: JSON.stringify({ sections: sectionScores, remarks }),
        },
      });

      await prisma.programResponse.deleteMany({ where: { submissionId } });

      const responses: any[] = [];
      for (const qm of questionMap) {
        const val = (r[qm.csvCol] || '').trim();
        if (!val) continue;

        const boolVal = parseBool(val);
        const numVal = parseFloat_(val);

        responses.push({
          id: uuid(`training-response-${submissionId}-${qm.questionId}`),
          submissionId,
          questionId: qm.questionId,
          answer: val,
          booleanValue: boolVal,
          numericValue: boolVal === null && val !== 'na' ? numVal : null,
          score: boolVal === true ? 1.0 : boolVal === false ? 0.0 : numVal !== null ? numVal : null,
          maxScore: qm.prefix === 'TSA' ? 10.0 : 1.0,
        });
      }

      if (responses.length > 0) {
        await prisma.programResponse.createMany({ data: responses });
      }
      created++;
    }

    // Progress
    const pct = Math.round(((batchStart + batch.length) / rows.length) * 100);
    process.stdout.write(`  Progress: ${pct}% (${batchStart + batch.length}/${rows.length})\r`);
  }

  console.log(`\n  ✓ ${created} Training Assessment submissions imported (${skipped} skipped)`);
}

// ════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════

async function main() {
  console.log('════════════════════════════════════════════════════');
  console.log('  Prism Platform — Submission Import');
  console.log('════════════════════════════════════════════════════\n');

  // Phase 1: Read all CSVs
  console.log('Phase 1: Reading CSV files...');
  const opsRows = readCSV('operations-audit.csv');
  const hrRows = readCSV('hr-connect.csv');
  const shlpRows = readCSV('shlp-assessment.csv');
  const campusRows = readCSV('campus-hiring.csv');
  const trainingRows = readCSV('training-assessment.csv');

  const totalRows = opsRows.length + hrRows.length + shlpRows.length + campusRows.length + trainingRows.length;
  console.log(`\n  Total: ${totalRows} rows across 5 CSVs`);

  // Phase 2: Collect and create stores/employees
  console.log('\nPhase 2: Creating stores & employees...');
  const { stores, employees } = collectStoresAndEmployees(opsRows, hrRows, shlpRows, campusRows, trainingRows);
  console.log(`  Found ${stores.size} unique stores, ${employees.size} unique employees`);
  const { storeIdMap, empIdMap } = await createStoresAndEmployees(stores, employees);

  // Phase 3: Load program data
  console.log('\nPhase 3: Loading program question mapping...');
  const programs = await loadProgramData();
  console.log(`  ✓ Loaded 5 programs`);

  // Phase 4: Import submissions
  console.log('\nPhase 4: Importing submissions...');
  await importOperationsAudit(opsRows, programs.opsAudit, storeIdMap, empIdMap);
  await importHRConnect(hrRows, programs.hrConnect, storeIdMap, empIdMap);
  await importSHLP(shlpRows, programs.shlp, storeIdMap, empIdMap);
  await importCampusHiring(campusRows, programs.campus, storeIdMap, empIdMap);
  await importTrainingAssessment(trainingRows, programs.training, storeIdMap, empIdMap);

  // Phase 5: Summary
  console.log('\n════════════════════════════════════════════════════');
  console.log('  Import Summary');
  console.log('════════════════════════════════════════════════════');

  const submissionCount = await prisma.programSubmission.count();
  const responseCount = await prisma.programResponse.count();
  const storeCount = await prisma.store.count();
  const employeeCount = await prisma.employee.count();

  console.log(`  Stores:      ${storeCount}`);
  console.log(`  Employees:   ${employeeCount}`);
  console.log(`  Submissions: ${submissionCount}`);
  console.log(`  Responses:   ${responseCount}`);
  console.log('\n✓ Import complete!\n');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('Import failed:', e);
    prisma.$disconnect();
    process.exit(1);
  });
