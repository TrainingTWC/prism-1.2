// ════════════════════════════════════════════════════════════════
//  Prism Platform — Finance Audit Import Script
// ════════════════════════════════════════════════════════════════
//
//  Creates a "Finance Audit" program and imports 492 historical
//  submissions from finance-audit.csv.
//
//  Usage:
//    cd packages/database
//    npx tsx scripts/import-finance-audit.ts
//
//  IDEMPOTENT — safe to run multiple times.
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

// Fixed IDs
const FINANCE_PROGRAM_ID = uuid('program-finance-audit');
const FINANCE_SECTION_ID = uuid('section-finance-audit-main');
const SYSTEM_EMPLOYEE_ID = uuid(`employee-${COMPANY_ID}-SYSTEM`);

// ── Parse date in M/D/YYYY format ──
function parseDate(val: string): Date | null {
  if (!val) return null;
  try {
    const cleaned = val.replace(',', '').trim();
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d;
    // Try DD/MM/YYYY
    const parts = cleaned.split('/');
    if (parts.length === 3) {
      const [a, b, c] = parts;
      const d2 = new Date(`${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`);
      if (!isNaN(d2.getTime())) return d2;
    }
    return null;
  } catch {
    return null;
  }
}

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

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  Prism — Finance Audit Import                     ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  // ── 1. Ensure SYSTEM employee exists ──
  console.log('══ Ensuring SYSTEM employee ══');
  await prisma.employee.upsert({
    where: { id: SYSTEM_EMPLOYEE_ID },
    create: {
      id: SYSTEM_EMPLOYEE_ID,
      companyId: COMPANY_ID,
      empId: 'SYSTEM',
      name: 'System (Auto-Import)',
      email: 'system-import@twc-import.local',
      passwordHash: '$2b$10$placeholder_hash_for_imported_employees',
      roleId: '00000000-0000-0000-0000-000000000012',
    },
    update: {},
  });
  console.log('  ✓ SYSTEM employee ready');

  // ── 2. Create Finance Audit program ──
  console.log('\n══ Creating Finance Audit program ══');
  await prisma.program.upsert({
    where: { id: FINANCE_PROGRAM_ID },
    create: {
      id: FINANCE_PROGRAM_ID,
      companyId: COMPANY_ID,
      name: 'Finance Audit',
      description: 'Financial compliance audit scoring for stores',
      type: 'QA_AUDIT',
      department: 'Finance',
      status: 'ACTIVE',
      scoringEnabled: true,
    },
    update: {
      name: 'Finance Audit',
      department: 'Finance',
      status: 'ACTIVE',
    },
  });
  console.log(`  ✓ Program ID: ${FINANCE_PROGRAM_ID}`);

  // ── 3. Create a section ──
  await prisma.programSection.upsert({
    where: { id: FINANCE_SECTION_ID },
    create: {
      id: FINANCE_SECTION_ID,
      programId: FINANCE_PROGRAM_ID,
      title: 'Finance Audit Checklist',
      order: 0,
      weight: 1.0,
      maxScore: 100,
    },
    update: {},
  });
  console.log('  ✓ Section created');

  // ── 4. Read CSV ──
  console.log('\n══ Reading finance-audit.csv ══');
  const rows = readCSV('finance-audit.csv');

  // ── 5. Build store code → ID lookup from DB ──
  console.log('\n══ Building store lookup ══');
  const dbStores = await prisma.store.findMany({
    where: { companyId: COMPANY_ID },
    select: { id: true, storeCode: true },
  });
  const storeMap = new Map<string, string>();
  for (const s of dbStores) {
    if (s.storeCode) storeMap.set(s.storeCode.toUpperCase(), s.id);
  }
  console.log(`  ✓ ${storeMap.size} stores in lookup`);

  // ── 6. Build submission records ──
  console.log('\n══ Preparing submissions ══');
  let skipped = 0;
  let notFound = 0;

  interface SubRecord {
    id: string;
    programId: string;
    employeeId: string;
    storeId: string;
    status: SubmissionStatus;
    score: number;
    maxScore: number;
    percentage: number;
    submittedAt: Date;
    sectionScores: any;
  }
  const records: SubRecord[] = [];

  for (const row of rows) {
    const code = (row['Store ID'] || '').trim().toUpperCase();
    const storeId = storeMap.get(code);
    if (!storeId) {
      if (notFound < 5) console.log(`    ⚠ Store ${code} not found in DB`);
      notFound++;
      continue;
    }

    const dateStr = row['Audit Date'] || '';
    const submittedAt = parseDate(dateStr);
    if (!submittedAt) {
      skipped++;
      continue;
    }

    const pct = parseFloat(row['Percentage'] || '0');
    const score = pct;
    const maxScore = 100;
    const submissionId = uuid(`finance-sub-${code}-${dateStr}`);

    records.push({
      id: submissionId,
      programId: FINANCE_PROGRAM_ID,
      employeeId: SYSTEM_EMPLOYEE_ID,
      storeId,
      status: 'SUBMITTED' as SubmissionStatus,
      score,
      maxScore,
      percentage: pct,
      submittedAt,
      sectionScores: [
        { sectionId: FINANCE_SECTION_ID, score, maxScore, percentage: pct },
      ],
    });
  }
  console.log(`  ✓ ${records.length} records prepared`);
  if (skipped) console.log(`  ⚠ ${skipped} rows skipped (bad date)`);
  if (notFound) console.log(`  ⚠ ${notFound} rows skipped (store not found)`);

  // ── 7. Batch import in chunks to avoid connection pool exhaustion ──
  console.log('\n══ Importing submissions (batched) ══');
  const BATCH = 50;
  let created = 0;

  for (let i = 0; i < records.length; i += BATCH) {
    const chunk = records.slice(i, i + BATCH);
    await prisma.$transaction(
      chunk.map(r =>
        prisma.programSubmission.upsert({
          where: { id: r.id },
          create: r,
          update: {
            score: r.score,
            maxScore: r.maxScore,
            percentage: r.percentage,
            submittedAt: r.submittedAt,
          },
        })
      )
    );
    created += chunk.length;
    console.log(`  Batch ${Math.floor(i / BATCH) + 1}: ${created}/${records.length}`);
  }

  console.log(`\n  ✓ ${created} submissions imported`);

  // ── Summary ──
  const total = await prisma.programSubmission.count({
    where: { programId: FINANCE_PROGRAM_ID },
  });
  console.log(`\n══ Finance Audit Summary ══`);
  console.log(`  Total submissions in DB: ${total}`);
  console.log(`  Program ID: ${FINANCE_PROGRAM_ID}`);

  await prisma.$disconnect();
  console.log('\n✅ Finance Audit import complete!');
}

main().catch((err) => {
  console.error('❌ Import failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
