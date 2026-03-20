// ──────────────────────────────────────────────────────────────
// Prism Platform — Historical CSV Data Import Script
// Imports: Training Assessment, SHLP, HR Connect, Operations Audit, Campus Hiring
// ──────────────────────────────────────────────────────────────

const { PrismaClient } = require('@prisma/client');
const { readFileSync } = require('fs');
const { join } = require('path');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const DATA_DIR = join(__dirname, 'submissions');
const COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const USER_ROLE_ID = '00000000-0000-0000-0000-000000000012';
const BATCH_SIZE = 50;

// ══════════════════════════════════════════════════════════════
//  CSV Parser — handles multi-line quoted fields
// ══════════════════════════════════════════════════════════════

function parseCSV(content) {
  const rows = [];
  let fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (inQuotes) {
      if (ch === '"' && i + 1 < content.length && content[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current);
      current = '';
    } else if (ch === '\r') {
      // skip
    } else if (ch === '\n') {
      fields.push(current);
      current = '';
      if (fields.some(f => f.trim() !== '')) {
        rows.push(fields);
      }
      fields = [];
    } else {
      current += ch;
    }
  }
  fields.push(current);
  if (fields.some(f => f.trim() !== '')) {
    rows.push(fields);
  }

  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1)
    .filter(row => row.length >= headers.length * 0.5) // skip partial rows
    .map(row => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = (row[idx] || '').trim();
      });
      return obj;
    });
}

// ══════════════════════════════════════════════════════════════
//  Lookup Maps
// ══════════════════════════════════════════════════════════════

let storeMap;     // storeCode (upper) → store UUID
let employeeMap;  // empId (upper) → employee UUID

async function buildLookups() {
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    select: { id: true, storeCode: true },
  });
  storeMap = new Map();
  for (const s of stores) {
    if (s.storeCode) storeMap.set(s.storeCode.toUpperCase(), s.id);
  }
  console.log(`  Loaded ${storeMap.size} stores`);

  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    select: { id: true, empId: true },
  });
  employeeMap = new Map();
  for (const e of employees) {
    employeeMap.set(e.empId.toUpperCase(), e.id);
  }
  console.log(`  Loaded ${employeeMap.size} employees`);
}

// ══════════════════════════════════════════════════════════════
//  Question Mapping Helpers
// ══════════════════════════════════════════════════════════════

async function getQuestionsBySection(programId) {
  const sections = await prisma.programSection.findMany({
    where: { programId },
    select: {
      id: true,
      title: true,
      order: true,
      questions: {
        select: { id: true, questionType: true, order: true },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  const map = new Map();
  for (const sec of sections) {
    map.set(sec.title, sec.questions.map(q => ({
      id: q.id,
      sectionId: sec.id,
      questionType: q.questionType,
    })));
  }
  return map;
}

// ══════════════════════════════════════════════════════════════
//  Value Helpers
// ══════════════════════════════════════════════════════════════

function parseScore(val) {
  if (!val || val === '' || val.toLowerCase() === 'na' || val === '-' || val === 'NA') return null;
  const cleaned = val.replace('%', '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseBool(val) {
  const v = (val || '').toLowerCase();
  if (v === 'yes' || v === 'true') return true;
  if (v === 'no' || v === 'false') return false;
  return null;
}

function parseDate(val) {
  if (!val || val.trim() === '') return null;
  // Handle "24/11/2025 11:51:53" format (DD/MM/YYYY)
  const ddmmyyyy = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(.*)?$/);
  if (ddmmyyyy) {
    const [, d, m, y, time] = ddmmyyyy;
    const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${time || '00:00:00'}`;
    const dt = new Date(iso);
    if (!isNaN(dt.getTime())) return dt;
  }
  // Handle "MM/DD/YYYY HH:mm:ss" format  
  const mmddyyyy = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}:\d{2}(?::\d{2})?)$/);
  if (mmddyyyy) {
    const [, m, d, y, time] = mmddyyyy;
    const dt = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${time}`);
    if (!isNaN(dt.getTime())) return dt;
  }
  // ISO format
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// ══════════════════════════════════════════════════════════════
//  Auto-Create Missing Employees from CSV Data
// ══════════════════════════════════════════════════════════════

async function autoCreateMissingEmployees() {
  console.log('\nScanning CSVs for missing employee IDs...');
  const missing = new Map(); // empId (upper) → { empId, name }

  // Training Assessment: Trainer Name/ID, Auditor Name/ID, AM Name/ID
  try {
    const taContent = readFileSync(join(DATA_DIR, 'training-assessment.csv'), 'utf-8');
    const taRows = parseCSV(taContent);
    for (const row of taRows) {
      const pairs = [
        { id: row['Trainer ID'], name: row['Trainer Name'] },
        { id: row['Auditor ID'], name: row['Auditor Name'] },
        { id: row['AM ID'], name: row['AM Name'] },
        { id: row['HRBP ID'], name: row['HRBP ID'] },
        { id: row['Regional HR ID'], name: row['Regional HR ID'] },
        { id: row['HR Head ID'], name: row['HR Head ID'] },
        { id: row['LMS Head ID'], name: row['LMS Head ID'] },
      ];
      for (const { id, name } of pairs) {
        if (id && id.trim()) {
          const key = id.trim().toUpperCase();
          if (!employeeMap.has(key) && !missing.has(key)) {
            missing.set(key, { empId: id.trim(), name: (name || id).trim() });
          }
        }
      }
    }
  } catch (e) { /* file may not exist */ }

  // Operations Audit: HR Name/ID, AM Name/ID, Trainer Name/ID
  try {
    const oaContent = readFileSync(join(DATA_DIR, 'operations-audit.csv'), 'utf-8');
    const oaRows = parseCSV(oaContent);
    for (const row of oaRows) {
      const pairs = [
        { id: row['Trainer ID'], name: row['Trainer Name'] },
        { id: row['HR ID'], name: row['HR Name'] },
        { id: row['AM ID'], name: row['AM Name'] },
      ];
      for (const { id, name } of pairs) {
        if (id && id.trim()) {
          const key = id.trim().toUpperCase();
          if (!employeeMap.has(key) && !missing.has(key)) {
            missing.set(key, { empId: id.trim(), name: (name || id).trim() });
          }
        }
      }
    }
  } catch (e) { /* file may not exist */ }

  if (missing.size === 0) {
    console.log('  No missing employees found.');
    return;
  }

  console.log(`  Found ${missing.size} missing employee IDs — creating them...`);

  const toCreate = [...missing.values()].map(({ empId, name }) => ({
    id: randomUUID(),
    empId,
    name,
    email: `${empId.toLowerCase()}@hbpl.in`,
    passwordHash: '$2b$10$placeholder_hash_for_auto_created_employees',
    department: 'Operations',
    designation: 'Staff',
    companyId: COMPANY_ID,
    roleId: USER_ROLE_ID,
    isActive: true,
  }));

  await prisma.employee.createMany({ data: toCreate, skipDuplicates: true });
  console.log(`  Created ${toCreate.length} employees`);

  // Rebuild employee map
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    select: { id: true, empId: true },
  });
  employeeMap = new Map();
  for (const e of employees) {
    employeeMap.set(e.empId.toUpperCase(), e.id);
  }
  console.log(`  Updated employee map: ${employeeMap.size} employees`);
}

// ══════════════════════════════════════════════════════════════
//  Batch Insert with Transactions
// ══════════════════════════════════════════════════════════════

async function batchInsert(submissions, responses) {
  let inserted = 0;
  for (let i = 0; i < submissions.length; i += BATCH_SIZE) {
    const subBatch = submissions.slice(i, i + BATCH_SIZE);
    const subIds = new Set(subBatch.map(s => s.id));
    const resBatch = responses.filter(r => subIds.has(r.submissionId));

    await prisma.$transaction([
      prisma.programSubmission.createMany({ data: subBatch, skipDuplicates: true }),
      prisma.programResponse.createMany({ data: resBatch, skipDuplicates: true }),
    ]);

    inserted += subBatch.length;
    process.stdout.write(`\r  Progress: ${inserted}/${submissions.length} submissions`);
  }
  console.log('');
}

// ══════════════════════════════════════════════════════════════
//  1. TRAINING ASSESSMENT
// ══════════════════════════════════════════════════════════════

async function importTrainingAssessment() {
  console.log('\n=== Importing Training Assessment ===');

  const PROGRAM_ID = 'ba5d46c5-405f-4924-8cd1-11c5ffdd1c00';
  const content = readFileSync(join(DATA_DIR, 'training-assessment.csv'), 'utf-8');
  const rows = parseCSV(content);
  console.log(`  Parsed ${rows.length} rows`);

  const questionMap = await getQuestionsBySection(PROGRAM_ID);

  // Map CSV column prefixes to DB sections
  const SECTION_MAPPINGS = [
    { prefix: 'TM', section: 'Training Materials' },
    { prefix: 'LMS', section: 'LMS Usage' },
    { prefix: 'Buddy', section: 'Buddy Trainer Availability & Capability' },
    { prefix: 'NJ', section: 'New Joiner Training & Records' },
    { prefix: 'PK', section: 'Partner Knowledge' },
    { prefix: 'CX', section: 'Customer Experience' },
    { prefix: 'AP', section: 'Action Plan & Continuous Improvement' },
  ];

  // Build column → question ID map
  const colToQuestion = [];
  for (const mapping of SECTION_MAPPINGS) {
    const questions = questionMap.get(mapping.section);
    if (!questions) {
      console.warn(`  WARNING: Section "${mapping.section}" not found in program`);
      continue;
    }
    for (let i = 0; i < questions.length; i++) {
      colToQuestion.push({
        col: `${mapping.prefix}_${i + 1}`,
        questionId: questions[i].id,
        questionType: questions[i].questionType,
      });
    }
  }
  console.log(`  Mapped ${colToQuestion.length} question columns`);

  const submissions = [];
  const responses = [];
  let skipped = 0;
  const skipReasons = { noStore: 0, noEmployee: 0 };

  for (const row of rows) {
    const storeCode = (row['Store ID'] || '').toUpperCase();
    // Use Auditor ID if present, otherwise Trainer ID
    let empIdRaw = (row['Auditor ID'] || '').toUpperCase();
    if (!empIdRaw || !employeeMap.has(empIdRaw)) {
      empIdRaw = (row['Trainer ID'] || '').toUpperCase();
    }

    const storeId = storeMap.get(storeCode);
    const employeeId = employeeMap.get(empIdRaw);

    if (!storeId) { skipped++; skipReasons.noStore++; continue; }
    if (!employeeId) { skipped++; skipReasons.noEmployee++; continue; }

    const submittedAt = parseDate(row['Submission Time']) || parseDate(row['Server Timestamp']) || new Date();
    const score = parseScore(row['Total Score']);
    const maxScore = parseScore(row['Max Score']);
    const percentage = parseScore(row['Percentage']);

    // Build section scores from TSA columns
    const sectionScores = [];
    if (row['TSA_1'] !== undefined && row['TSA_1'] !== '') sectionScores.push({ section: 'TSA Food', score: parseScore(row['TSA_1']) });
    if (row['TSA_2'] !== undefined && row['TSA_2'] !== '') sectionScores.push({ section: 'TSA Coffee', score: parseScore(row['TSA_2']) });
    if (row['TSA_3'] !== undefined && row['TSA_3'] !== '') sectionScores.push({ section: 'TSA CX', score: parseScore(row['TSA_3']) });

    const submissionId = randomUUID();
    submissions.push({
      id: submissionId,
      programId: PROGRAM_ID,
      employeeId,
      storeId,
      status: 'SUBMITTED',
      score,
      maxScore,
      percentage,
      submittedAt,
      startedAt: submittedAt,
      sectionScores: sectionScores.length > 0 ? sectionScores : [],
      createdAt: submittedAt,
      updatedAt: submittedAt,
    });

    // Create responses for each mapped question
    for (const mapping of colToQuestion) {
      const val = row[mapping.col];
      if (val === undefined || val === '') continue;

      responses.push({
        id: randomUUID(),
        submissionId,
        questionId: mapping.questionId,
        answer: val,
        booleanValue: parseBool(val),
        numericValue: parseScore(val),
        createdAt: submittedAt,
      });
    }

    // Also store remarks as comments on the last question of each section
    const remarkMappings = [
      { remarkCol: 'TM_remarks', section: 'Training Materials' },
      { remarkCol: 'LMS_remarks', section: 'LMS Usage' },
      { remarkCol: 'Buddy_remarks', section: 'Buddy Trainer Availability & Capability' },
      { remarkCol: 'NJ_remarks', section: 'New Joiner Training & Records' },
      { remarkCol: 'PK_remarks', section: 'Partner Knowledge' },
      { remarkCol: 'CX_remarks', section: 'Customer Experience' },
      { remarkCol: 'AP_remarks', section: 'Action Plan & Continuous Improvement' },
      { remarkCol: 'TSA_Food_remarks', section: 'TSA - Food: Personal Hygiene' },
      { remarkCol: 'TSA_Coffee_remarks', section: 'TSA - Coffee: Personal Hygiene' },
      { remarkCol: 'TSA_CX_remarks', section: 'TSA - CX: Personal Hygiene' },
    ];
    for (const rm of remarkMappings) {
      const remark = row[rm.remarkCol];
      if (!remark || remark === '') continue;
      const questions = questionMap.get(rm.section);
      if (!questions || questions.length === 0) continue;
      // Store remark as a text response on the last question of that section
      const lastQ = questions[questions.length - 1];
      // Check if we already have a response for this question
      const existing = responses.find(r => r.submissionId === submissionId && r.questionId === lastQ.id);
      if (existing) {
        existing.comment = remark;
      } else {
        responses.push({
          id: randomUUID(),
          submissionId,
          questionId: lastQ.id,
          answer: null,
          comment: remark,
          createdAt: submittedAt,
        });
      }
    }
  }

  console.log(`  Ready: ${submissions.length} submissions, ${responses.length} responses (skipped: ${skipped} — noStore: ${skipReasons.noStore}, noEmployee: ${skipReasons.noEmployee})`);
  if (submissions.length > 0) {
    await batchInsert(submissions, responses);
  }
  console.log('  DONE: Training Assessment');
}

// ══════════════════════════════════════════════════════════════
//  2. SHLP ASSESSMENT
// ══════════════════════════════════════════════════════════════

async function importSHLPAssessment() {
  console.log('\n=== Importing SHLP Assessment ===');

  const PROGRAM_ID = '9e0dffef-abb7-4c81-85b4-4921e977b335';
  const content = readFileSync(join(DATA_DIR, 'shlp-assessment.csv'), 'utf-8');
  const rows = parseCSV(content);
  console.log(`  Parsed ${rows.length} rows`);

  const questionMap = await getQuestionsBySection(PROGRAM_ID);

  // SHLP_1..35 map to sections in order
  const SECTION_MAPPINGS = [
    { section: 'Store Readiness', count: 4 },
    { section: 'Product Quality & Standards', count: 5 },
    { section: 'Cash & Administration', count: 5 },
    { section: 'Team Management', count: 8 },
    { section: 'Operations & Availability', count: 7 },
    { section: 'Safety & Compliance', count: 3 },
    { section: 'Shift Closing', count: 1 },
    { section: 'Business Acumen', count: 2 },
  ];

  // Build column → question map
  const colToQuestion = [];
  let qIdx = 1;
  for (const mapping of SECTION_MAPPINGS) {
    const questions = questionMap.get(mapping.section);
    if (!questions) {
      console.warn(`  WARNING: Section "${mapping.section}" not found`);
      qIdx += mapping.count;
      continue;
    }
    for (let i = 0; i < Math.min(mapping.count, questions.length); i++) {
      colToQuestion.push({
        col: `SHLP_${qIdx}`,
        remarkCol: `SHLP_${qIdx}_remarks`,
        questionId: questions[i].id,
        questionType: questions[i].questionType,
      });
      qIdx++;
    }
  }
  console.log(`  Mapped ${colToQuestion.length} question columns`);

  const submissions = [];
  const responses = [];
  let skipped = 0;

  for (const row of rows) {
    const storeCode = (row['Store'] || '').toUpperCase();
    const empIdRaw = (row['Employee ID'] || '').toUpperCase();

    const storeId = storeMap.get(storeCode);
    const employeeId = employeeMap.get(empIdRaw);

    if (!storeId) { skipped++; continue; }
    if (!employeeId) { skipped++; continue; }

    const submittedAt = parseDate(row['Submission Time']) || parseDate(row['Server Timestamp']) || new Date();

    // Section scores from CSV
    const sectionScores = [
      { section: 'Store Readiness', score: parseScore(row['Store_Readiness_Score']) },
      { section: 'Product Quality', score: parseScore(row['Product_Quality_Score']) },
      { section: 'Cash & Admin', score: parseScore(row['Cash_Admin_Score']) },
      { section: 'Team Management', score: parseScore(row['Team_Management_Score']) },
      { section: 'Operations', score: parseScore(row['Operations_Score']) },
      { section: 'Safety', score: parseScore(row['Safety_Score']) },
      { section: 'Shift Closing', score: parseScore(row['Shift_Closing_Score']) },
      { section: 'Business', score: parseScore(row['Business_Score']) },
    ].filter(s => s.score !== null);

    const overallScore = parseScore(row['Overall_Score']);
    const overallPct = parseScore(row['Overall_Percentage']);

    const submissionId = randomUUID();
    submissions.push({
      id: submissionId,
      programId: PROGRAM_ID,
      employeeId,
      storeId,
      status: 'SUBMITTED',
      score: overallScore,
      maxScore: 100,
      percentage: overallPct,
      submittedAt,
      startedAt: submittedAt,
      sectionScores,
      createdAt: submittedAt,
      updatedAt: submittedAt,
    });

    for (const mapping of colToQuestion) {
      const val = row[mapping.col];
      if (val === undefined || val === '') continue;

      const remark = row[mapping.remarkCol] || null;
      responses.push({
        id: randomUUID(),
        submissionId,
        questionId: mapping.questionId,
        answer: val,
        booleanValue: parseBool(val),
        numericValue: parseScore(val),
        comment: remark || undefined,
        createdAt: submittedAt,
      });
    }
  }

  console.log(`  Ready: ${submissions.length} submissions, ${responses.length} responses (skipped: ${skipped})`);
  if (submissions.length > 0) {
    await batchInsert(submissions, responses);
  }
  console.log('  DONE: SHLP Assessment');
}

// ══════════════════════════════════════════════════════════════
//  3. HR CONNECT
// ══════════════════════════════════════════════════════════════

async function importHRConnect() {
  console.log('\n=== Importing HR Connect ===');

  const PROGRAM_ID = '819ba2b8-b920-49dd-8a70-709dc37028f5';
  const content = readFileSync(join(DATA_DIR, 'hr-connect.csv'), 'utf-8');
  const rows = parseCSV(content);
  console.log(`  Parsed ${rows.length} rows`);

  const questionMap = await getQuestionsBySection(PROGRAM_ID);
  const questions = questionMap.get('HR Connect Questions');
  if (!questions || questions.length === 0) {
    console.error('  ERROR: HR Connect Questions section not found!');
    return;
  }
  console.log(`  Found ${questions.length} questions in section`);

  // HR Connect CSV has columns like:
  // "Q1 - Work Pressure in Café", "Q1 Remarks", "Q2 - Decision Making...", "Q2 Remarks", ...
  // Find the Q columns from headers
  const firstRow = rows[0];
  const qColumns = [];
  const headers = Object.keys(firstRow);

  for (let qNum = 1; qNum <= 12; qNum++) {
    // Find the answer column (matches "Q{n} - " or "Q{n}:" pattern)
    const answerCol = headers.find(h =>
      h.match(new RegExp(`^Q${qNum}\\s*[-:]`)) ||
      h.match(new RegExp(`^Q${qNum}\\b`)) && !h.includes('Remarks') && !h.includes('Weight')
    );
    const remarkCol = headers.find(h =>
      h.match(new RegExp(`^Q${qNum}\\s+Remarks`, 'i')) ||
      h.match(new RegExp(`^Q${qNum} Remarks`, 'i'))
    );

    if (answerCol && qNum <= questions.length) {
      qColumns.push({
        answerCol,
        remarkCol: remarkCol || null,
        questionId: questions[qNum - 1].id,
        questionType: questions[qNum - 1].questionType,
      });
    }
  }
  console.log(`  Mapped ${qColumns.length} question columns`);

  const submissions = [];
  const responses = [];
  let skipped = 0;

  for (const row of rows) {
    const storeCode = (row['Store ID'] || '').toUpperCase();
    const empIdRaw = (row['Emp ID'] || '').toUpperCase().trim();

    const storeId = storeMap.get(storeCode);
    const employeeId = employeeMap.get(empIdRaw);

    if (!storeId) { skipped++; continue; }
    if (!employeeId) { skipped++; continue; }

    const submittedAt = parseDate(row['Submission Time']) || parseDate(row['Server Timestamp']) || new Date();
    const score = parseScore(row['Total Score']);
    const maxScore = parseScore(row['Max Score']);
    const percentage = parseScore(row['Percent']);

    const submissionId = randomUUID();
    submissions.push({
      id: submissionId,
      programId: PROGRAM_ID,
      employeeId,
      storeId,
      status: 'SUBMITTED',
      score,
      maxScore,
      percentage,
      submittedAt,
      startedAt: submittedAt,
      sectionScores: [],
      createdAt: submittedAt,
      updatedAt: submittedAt,
    });

    for (const qMap of qColumns) {
      const val = row[qMap.answerCol];
      if (val === undefined || val === '') continue;

      const remark = qMap.remarkCol ? (row[qMap.remarkCol] || null) : null;
      responses.push({
        id: randomUUID(),
        submissionId,
        questionId: qMap.questionId,
        answer: val,
        booleanValue: parseBool(val),
        numericValue: parseScore(val),
        comment: remark || undefined,
        createdAt: submittedAt,
      });
    }
  }

  console.log(`  Ready: ${submissions.length} submissions, ${responses.length} responses (skipped: ${skipped})`);
  if (submissions.length > 0) {
    await batchInsert(submissions, responses);
  }
  console.log('  DONE: HR Connect');
}

// ══════════════════════════════════════════════════════════════
//  4. OPERATIONS AUDIT
// ══════════════════════════════════════════════════════════════

async function importOperationsAudit() {
  console.log('\n=== Importing Operations Audit ===');

  const PROGRAM_ID = '80457773-31c4-4642-8b91-fc74e419ce73';
  const content = readFileSync(join(DATA_DIR, 'operations-audit.csv'), 'utf-8');
  const rows = parseCSV(content);
  console.log(`  Parsed ${rows.length} rows`);

  const questionMap = await getQuestionsBySection(PROGRAM_ID);

  const SECTION_MAPPINGS = [
    { prefix: 'CG', start: 1, count: 13, section: 'Cheerful Greeting' },
    { prefix: 'OTA', start: 101, count: 11, section: 'Order Taking Assistance' },
    { prefix: 'FAS', start: 201, count: 13, section: 'Friendly & Accurate Service' },
    { prefix: 'FWS', start: 301, count: 13, section: 'Feedback with Solution' },
    { prefix: 'ENJ', start: 401, count: 7, section: 'Enjoyable Experience' },
    { prefix: 'EX', start: 501, count: 6, section: 'Enthusiastic Exit' },
  ];

  const colToQuestion = [];
  for (const mapping of SECTION_MAPPINGS) {
    const questions = questionMap.get(mapping.section);
    if (!questions) {
      console.warn(`  WARNING: Section "${mapping.section}" not found`);
      continue;
    }
    for (let i = 0; i < Math.min(mapping.count, questions.length); i++) {
      colToQuestion.push({
        col: `${mapping.prefix}_${mapping.start + i}`,
        questionId: questions[i].id,
        questionType: questions[i].questionType,
      });
    }
  }
  console.log(`  Mapped ${colToQuestion.length} question columns`);

  const submissions = [];
  const responses = [];
  let skipped = 0;

  for (const row of rows) {
    const storeCode = (row['Store ID'] || '').toUpperCase();
    // Use Trainer ID as the auditor/submitter
    let empIdRaw = (row['Trainer ID'] || '').toUpperCase();
    if (!empIdRaw || !employeeMap.has(empIdRaw)) {
      empIdRaw = (row['HR ID'] || '').toUpperCase();
    }

    const storeId = storeMap.get(storeCode);
    const employeeId = employeeMap.get(empIdRaw);

    if (!storeId) { skipped++; continue; }
    if (!employeeId) { skipped++; continue; }

    const submittedAt = parseDate(row['Submission Time']) || parseDate(row['Server Timestamp']) || new Date();
    const score = parseScore(row['Total Score']);
    const maxScore = parseScore(row['Max Score']);
    const percentage = parseScore(row['Percentage Score']);

    // Section scores
    const sectionScores = [
      { section: 'Cheerful Greeting', score: parseScore(row['CG_Score']) },
      { section: 'Order Taking Assistance', score: parseScore(row['OTA_Score']) },
      { section: 'Friendly & Accurate Service', score: parseScore(row['FAS_Score']) },
      { section: 'Feedback with Solution', score: parseScore(row['FWS_Score']) },
      { section: 'Enjoyable Experience', score: parseScore(row['ENJ_Score']) },
      { section: 'Enthusiastic Exit', score: parseScore(row['EX_Score']) },
    ].filter(s => s.score !== null);

    const submissionId = randomUUID();
    submissions.push({
      id: submissionId,
      programId: PROGRAM_ID,
      employeeId,
      storeId,
      status: 'SUBMITTED',
      score,
      maxScore,
      percentage,
      submittedAt,
      startedAt: submittedAt,
      sectionScores,
      createdAt: submittedAt,
      updatedAt: submittedAt,
    });

    for (const mapping of colToQuestion) {
      const val = row[mapping.col];
      if (val === undefined || val === '') continue;

      responses.push({
        id: randomUUID(),
        submissionId,
        questionId: mapping.questionId,
        answer: val,
        booleanValue: parseBool(val),
        numericValue: parseScore(val),
        createdAt: submittedAt,
      });
    }
  }

  console.log(`  Ready: ${submissions.length} submissions, ${responses.length} responses (skipped: ${skipped})`);
  if (submissions.length > 0) {
    await batchInsert(submissions, responses);
  }
  console.log('  DONE: Operations Audit');
}

// ══════════════════════════════════════════════════════════════
//  5. CAMPUS HIRING
// ══════════════════════════════════════════════════════════════

async function importCampusHiring() {
  console.log('\n=== Importing Campus Hiring ===');

  const PROGRAM_ID = 'b18a0d8f-4dca-42ac-811d-e3f4bf047908';
  const content = readFileSync(join(DATA_DIR, 'campus-hiring.csv'), 'utf-8');
  const rows = parseCSV(content);
  console.log(`  Parsed ${rows.length} rows`);

  const questionMap = await getQuestionsBySection(PROGRAM_ID);

  const SECTION_MAPPINGS = [
    { section: 'Psychometric', count: 5 },
    { section: 'English Proficiency', count: 5 },
    { section: 'Numerical Aptitude', count: 5 },
    { section: 'Logical Reasoning', count: 5 },
    { section: 'Analytical Aptitude', count: 5 },
    { section: 'Course Curriculum', count: 5 },
  ];

  // Campus CSV has Q1-Q30 with Weight columns
  // Q1: Psychometric, Q1 Weight, Q2: Psychometric, Q2 Weight, ...
  const headers = Object.keys(rows[0] || {});
  const colToQuestion = [];
  let globalQNum = 1;

  for (const mapping of SECTION_MAPPINGS) {
    const questions = questionMap.get(mapping.section);
    if (!questions) {
      console.warn(`  WARNING: Section "${mapping.section}" not found`);
      globalQNum += mapping.count;
      continue;
    }
    for (let i = 0; i < Math.min(mapping.count, questions.length); i++) {
      // Find the column for this question (Q{n}: Section Name)
      const answerCol = headers.find(h =>
        h.match(new RegExp(`^Q${globalQNum}[:\\s]`)) && !h.includes('Weight')
      );
      const weightCol = headers.find(h =>
        h.match(new RegExp(`^Q${globalQNum}\\s+Weight`, 'i')) ||
        h === `Q${globalQNum} Weight`
      );

      if (answerCol) {
        colToQuestion.push({
          answerCol,
          weightCol: weightCol || null,
          questionId: questions[i].id,
          questionType: questions[i].questionType,
        });
      }
      globalQNum++;
    }
  }
  console.log(`  Mapped ${colToQuestion.length} question columns`);

  // Create a "Campus Hiring" store if it doesn't exist
  let campusStoreId = storeMap.get('CAMPUS');
  if (!campusStoreId) {
    const campusStore = await prisma.store.create({
      data: {
        id: randomUUID(),
        companyId: COMPANY_ID,
        storeName: 'Campus Hiring Center',
        storeCode: 'CAMPUS',
        city: 'Mumbai',
        state: 'Maharashtra',
        isActive: true,
      },
    });
    campusStoreId = campusStore.id;
    storeMap.set('CAMPUS', campusStoreId);
    console.log(`  Created "Campus Hiring Center" store`);
  }

  // Create employee records for unique candidates
  const candidateEmails = new Map(); // email → employeeUUID
  let candidatesCreated = 0;

  for (const row of rows) {
    const email = (row['Candidate Email'] || '').toLowerCase().trim();
    if (!email || candidateEmails.has(email)) continue;

    // Check if already exists
    const existingEmp = await prisma.employee.findFirst({
      where: { companyId: COMPANY_ID, email: email },
      select: { id: true },
    });

    if (existingEmp) {
      candidateEmails.set(email, existingEmp.id);
      continue;
    }

    const candidateName = row['Candidate Name'] || 'Unknown Candidate';
    const phone = row['Candidate Phone'] || null;
    const campusName = row['Campus Name'] || 'Unknown Campus';
    const empId = `CH${String(candidatesCreated + 1).padStart(4, '0')}`;

    try {
      const newEmp = await prisma.employee.create({
        data: {
          id: randomUUID(),
          companyId: COMPANY_ID,
          empId,
          name: candidateName,
          email,
          passwordHash: '$2b$10$placeholder.hash.for.campus.candidates',
          phone,
          department: 'Campus Hiring',
          designation: 'Candidate',
          category: campusName,
          location: campusName,
          storeId: campusStoreId,
          roleId: USER_ROLE_ID,
          isActive: true,
        },
      });
      candidateEmails.set(email, newEmp.id);
      candidatesCreated++;
    } catch (err) {
      // Might fail on unique constraint — skip
      console.warn(`  WARNING: Could not create candidate ${email}: ${err.message}`);
    }
  }
  console.log(`  Created ${candidatesCreated} candidate employee records`);

  const submissions = [];
  const responses = [];
  let skipped = 0;

  for (const row of rows) {
    const email = (row['Candidate Email'] || '').toLowerCase().trim();
    const employeeId = candidateEmails.get(email);

    if (!employeeId) { skipped++; continue; }

    const submittedAt = parseDate(row['Submission Time']) || parseDate(row['Timestamp']) || new Date();
    const score = parseScore(row['Total Score']);
    const maxScore = parseScore(row['Max Score']);
    const percentage = parseScore(row['Score Percentage']);

    // Section percentage scores
    const sectionScores = [
      { section: 'Psychometric', score: parseScore(row['Psychometric Score %']) },
      { section: 'English Proficiency', score: parseScore(row['English Proficiency Score %']) },
      { section: 'Numerical Aptitude', score: parseScore(row['Numerical Aptitude Score %']) },
      { section: 'Logical Reasoning', score: parseScore(row['Logical Reasoning Score %']) },
      { section: 'Analytical Aptitude', score: parseScore(row['Analytical Aptitude Score %']) },
      { section: 'Course Curriculum', score: parseScore(row['Course Curriculum Score %']) },
    ].filter(s => s.score !== null);

    const submissionId = randomUUID();
    submissions.push({
      id: submissionId,
      programId: PROGRAM_ID,
      employeeId,
      storeId: campusStoreId,
      status: 'SUBMITTED',
      score,
      maxScore,
      percentage,
      submittedAt,
      startedAt: submittedAt,
      sectionScores,
      createdAt: submittedAt,
      updatedAt: submittedAt,
    });

    for (const mapping of colToQuestion) {
      const val = row[mapping.answerCol];
      if (val === undefined || val === '') continue;

      const weight = mapping.weightCol ? parseScore(row[mapping.weightCol]) : null;
      responses.push({
        id: randomUUID(),
        submissionId,
        questionId: mapping.questionId,
        answer: val,
        numericValue: weight,
        score: weight,
        maxScore: 3, // Campus hiring max weight per question is 3
        createdAt: submittedAt,
      });
    }
  }

  console.log(`  Ready: ${submissions.length} submissions, ${responses.length} responses (skipped: ${skipped})`);
  if (submissions.length > 0) {
    await batchInsert(submissions, responses);
  }
  console.log('  DONE: Campus Hiring');
}

// ══════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Prism — Historical Data Import             ║');
  console.log('╚══════════════════════════════════════════════╝');

  // Check existing submission count
  const existingCount = await prisma.programSubmission.count();
  console.log(`\nExisting submissions in DB: ${existingCount}`);

  console.log('\nBuilding lookup maps...');
  await buildLookups();

  // Auto-create missing employees (trainers, auditors, HRs)
  await autoCreateMissingEmployees();

  // Only run imports that haven't been completed yet
  // SHLP (211), HR Connect (574), Campus Hiring (1302) — already imported
  // Training Assessment and Operations Audit — need re-run
  await importTrainingAssessment();
  // await importSHLPAssessment();      // Already imported: 211
  // await importHRConnect();           // Already imported: 574
  await importOperationsAudit();
  // await importCampusHiring();        // Already imported: 1302

  // Final counts
  const finalCount = await prisma.programSubmission.count();
  const responseCount = await prisma.programResponse.count();
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log(`║  Import Complete!                            ║`);
  console.log(`║  Total Submissions: ${String(finalCount).padStart(6)}                  ║`);
  console.log(`║  Total Responses:   ${String(responseCount).padStart(6)}                  ║`);
  console.log(`║  New Submissions:   ${String(finalCount - existingCount).padStart(6)}                  ║`);
  console.log('╚══════════════════════════════════════════════╝');

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('\nFATAL ERROR:', err);
  await prisma.$disconnect();
  process.exit(1);
});
