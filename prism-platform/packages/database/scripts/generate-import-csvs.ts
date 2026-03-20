// ════════════════════════════════════════════════════════════════
//  Generate Supabase-ready CSVs from raw master data
// ════════════════════════════════════════════════════════════════
//
//  Reads:
//    data/submissions/store-mapping.csv
//    data/submissions/employee-master.csv
//
//  Outputs:
//    data/submissions/supabase-store-import.csv
//    data/submissions/supabase-employee-import.csv
//
//  Usage:
//    cd packages/database
//    npx tsx scripts/generate-import-csvs.ts
// ════════════════════════════════════════════════════════════════

import { createHash } from 'crypto';
import { parse } from 'csv-parse/sync';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(__dirname, '..', 'data', 'submissions');
const COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const USER_ROLE_ID = '00000000-0000-0000-0000-000000000012';
const DEFAULT_PASSWORD = '$2b$10$placeholder.hash.for.imported.employees';

// ── Deterministic UUID from a seed string ──
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

// ── Region name → UUID ──
const REGION_MAP: Record<string, string> = {
  'north':         '00000000-0000-0000-0000-000000000050',
  'south':         '00000000-0000-0000-0000-000000000051',
  'west':          '00000000-0000-0000-0000-000000000052',
  'central':       '00000000-0000-0000-0000-000000000053',
  'rest of south': '00000000-0000-0000-0000-000000000054',
};

// ── Read CSV helper ──
function readCSV(filename: string): Record<string, string>[] {
  const raw = readFileSync(join(DATA_DIR, filename), 'utf-8');
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    relax_quotes: true,
  });
}

// ── Escape CSV value ──
function esc(val: string | null | undefined): string {
  if (val === null || val === undefined || val === '' || val === '-') return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// ── Normalize emp code to uppercase ──
function normId(id: string): string {
  return (id || '').trim().toUpperCase();
}

// ── Parse date like "07 Feb 2026" → "2026-02-07" ──
function parseDate(s: string): string {
  if (!s || s === '-') return '';
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const parts = s.trim().split(/\s+/);
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const mon = months[parts[1].toLowerCase()] || '01';
    const year = parts[2];
    return `${year}-${mon}-${day}`;
  }
  return '';
}

// ══════════════════════════════════════════════════════════
//  GENERATE store CSV
// ══════════════════════════════════════════════════════════
function generateStoreCSV() {
  const rows = readCSV('store-mapping.csv');
  console.log(`  Read ${rows.length} stores from store-mapping.csv`);

  const storeHeaders = [
    'id', 'company_id', 'region_id', 'store_name', 'store_code', 'city',
    'am_id', 'am_name',
    'hrbp_1_id', 'hrbp_1_name', 'hrbp_2_id', 'hrbp_2_name', 'hrbp_3_id', 'hrbp_3_name',
    'trainer_1_id', 'trainer_1_name', 'trainer_2_id', 'trainer_2_name', 'trainer_3_id', 'trainer_3_name',
    'regional_trainer_id', 'regional_trainer_name',
    'regional_hr_id', 'regional_hr_name',
    'hr_head_id', 'hr_head_name',
    'store_format', 'menu_type', 'price_group',
    'latitude', 'longitude',
    'is_active',
  ];

  const csvLines: string[] = [storeHeaders.join(',')];

  for (const r of rows) {
    const storeCode = normId(r['Store ID']);
    if (!storeCode) continue;

    const storeId = uuid(`store-${COMPANY_ID}-${storeCode}`);
    const region = (r['Region'] || '').toLowerCase().trim();
    const regionId = REGION_MAP[region] || '';

    const vals = [
      storeId,
      COMPANY_ID,
      regionId,
      esc(r['Store Name']),
      storeCode,
      esc(r['Region'] || 'Unknown'),    // city ← region name as placeholder
      esc(normId(r['AM ID']) === '-' ? '' : normId(r['AM ID'])),
      esc(r['AM Name'] === '-' ? '' : r['AM Name']),
      esc(normId(r['HRBP 1 ID']) === '-' ? '' : normId(r['HRBP 1 ID'])),
      esc(r['HRBP 1 Name'] === '-' ? '' : r['HRBP 1 Name']),
      esc(normId(r['HRBP 2 ID']) === '-' ? '' : normId(r['HRBP 2 ID'])),
      esc(r['HRBP 2 Name'] === '-' ? '' : r['HRBP 2 Name']),
      esc(normId(r['HRBP 3 ID']) === '-' ? '' : normId(r['HRBP 3 ID'])),
      esc(r['HRBP 3 Name'] === '-' ? '' : r['HRBP 3 Name']),
      esc(normId(r['Trainer 1 ID']) === '-' ? '' : normId(r['Trainer 1 ID'])),
      esc(r['Trainer 1 Name'] === '-' ? '' : r['Trainer 1 Name']),
      esc(normId(r['Trainer 2 ID']) === '-' ? '' : normId(r['Trainer 2 ID'])),
      esc(r['Trainer 2 Name'] === '-' ? '' : r['Trainer 2 Name']),
      esc(normId(r['Trainer 3 ID']) === '-' ? '' : normId(r['Trainer 3 ID'])),
      esc(r['Trainer 3 Name'] === '-' ? '' : r['Trainer 3 Name']),
      esc(normId(r['Regional Trainer ID']) === '-' ? '' : normId(r['Regional Trainer ID'])),
      esc(r['Regional Trainer name'] === '-' ? '' : r['Regional Trainer name']),
      esc(normId(r['Regional HR ID']) === '-' ? '' : normId(r['Regional HR ID'])),
      esc(r['Regional HR Name'] === '-' ? '' : r['Regional HR Name']),
      esc(normId(r['HR Head ID']) === '-' ? '' : normId(r['HR Head ID'])),
      esc(r['HR Head Name'] === '-' ? '' : r['HR Head Name']),
      esc(r['Store Format']),
      esc(r['Menu Type']),
      esc(r['Price Group']),
      r['Latitude'] || '',
      r['Longitude'] || '',
      'true',
    ];
    csvLines.push(vals.join(','));
  }

  const outPath = join(DATA_DIR, 'supabase-store-import.csv');
  writeFileSync(outPath, csvLines.join('\n'), 'utf-8');
  console.log(`  ✓ Wrote ${csvLines.length - 1} rows → supabase-store-import.csv`);

  // Return storeCode → storeUuid map for employee linking
  const storeMap = new Map<string, string>();
  for (const r of rows) {
    const code = normId(r['Store ID']);
    if (code) storeMap.set(code, uuid(`store-${COMPANY_ID}-${code}`));
  }
  return storeMap;
}

// ══════════════════════════════════════════════════════════
//  GENERATE employee CSV
// ══════════════════════════════════════════════════════════
function generateEmployeeCSV(storeMap: Map<string, string>) {
  const rows = readCSV('employee-master.csv');
  console.log(`  Read ${rows.length} employees from employee-master.csv`);

  const empHeaders = [
    'id', 'company_id', 'emp_id', 'name', 'email', 'password_hash',
    'department', 'designation', 'date_of_joining', 'location', 'category',
    'store_id', 'role_id', 'is_active',
  ];

  const csvLines: string[] = [empHeaders.join(',')];
  const seen = new Set<string>();

  for (const r of rows) {
    const empCode = normId(r['Employee_Code']);
    if (!empCode || seen.has(empCode)) continue;
    seen.add(empCode);

    const employeeId = uuid(`employee-${COMPANY_ID}-${empCode}`);
    const storeCode = normId(r['Store ID']);
    const storeId = storeMap.get(storeCode) || '';
    const email = `${empCode.toLowerCase()}@hbpl.local`;
    const doj = parseDate(r['Date_Of_Joining'] || '');

    const vals = [
      employeeId,
      COMPANY_ID,
      empCode,
      esc(r['EmpName'] || empCode),
      email,
      DEFAULT_PASSWORD,
      esc(r['Category'] || 'Store'),
      esc(r['Designation']),
      doj,
      esc(r['Location']),
      esc(r['Category']),
      storeId,
      USER_ROLE_ID,
      'true',
    ];
    csvLines.push(vals.join(','));
  }

  const outPath = join(DATA_DIR, 'supabase-employee-import.csv');
  writeFileSync(outPath, csvLines.join('\n'), 'utf-8');
  console.log(`  ✓ Wrote ${csvLines.length - 1} rows → supabase-employee-import.csv`);
}

// ══════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════
console.log('════════════════════════════════════════════════════════');
console.log('  Generating Supabase-ready import CSVs');
console.log('════════════════════════════════════════════════════════\n');

const storeMap = generateStoreCSV();
generateEmployeeCSV(storeMap);

console.log('\n✓ Done! Import order in Supabase:');
console.log('  1. supabase-store-import.csv  → store table');
console.log('  2. supabase-employee-import.csv → employee table');
console.log(`\n  Files at: ${DATA_DIR}\n`);
