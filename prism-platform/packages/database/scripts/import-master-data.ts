// ════════════════════════════════════════════════════════════════
//  Prism Platform — Master Data Import Script
// ════════════════════════════════════════════════════════════════
//
//  Imports real TWC stores and employees from CSV master files:
//    - store-mapping.csv  → Store table (+ manager-level employees)
//    - employee-master.csv → Employee table (store-level staff)
//
//  Also imports historical submissions from 5 CSV files.
//
//  Usage:
//    cd packages/database
//    npx tsx scripts/import-master-data.ts
//
//  IDEMPOTENT — safe to run multiple times.
// ════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();
const COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const DATA_DIR = join(__dirname, '..', 'data', 'submissions');
const DEFAULT_PASSWORD = '$2b$10$placeholder.hash.for.imported.employees';

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

// ── Region map ──
const REGION_MAP: Record<string, string> = {
  'north': '00000000-0000-0000-0000-000000000050',
  'south': '00000000-0000-0000-0000-000000000051',
  'west': '00000000-0000-0000-0000-000000000052',
  'central': '00000000-0000-0000-0000-000000000053',
  'rest of south': '00000000-0000-0000-0000-000000000054',
};

// ── Role map ──
const ROLES = {
  editor: '00000000-0000-0000-0000-000000000010',
  admin: '00000000-0000-0000-0000-000000000011',
  user: '00000000-0000-0000-0000-000000000012',
};

// ── Read CSV ──
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

// Normalize emp ID to uppercase for consistency
function normId(id: string): string {
  return (id || '').trim().toUpperCase();
}

// ════════════════════════════════════════════════════════════════
//  PHASE 1: Import Stores from store-mapping.csv
// ════════════════════════════════════════════════════════════════

async function importStores(storeRows: Record<string, string>[]): Promise<Map<string, string>> {
  console.log(`\n══ Phase 1: Importing ${storeRows.length} stores ══`);

  const storeCodeToUuid = new Map<string, string>();

  for (const r of storeRows) {
    const storeCode = normId(r['Store ID']);
    if (!storeCode) continue;

    const storeId = uuid(`store-${COMPANY_ID}-${storeCode}`);
    storeCodeToUuid.set(storeCode, storeId);

    const region = (r['Region'] || '').toLowerCase().trim();
    const regionId = REGION_MAP[region] || null;
    const latitude = r['Latitude'] ? parseFloat(r['Latitude']) : null;
    const longitude = r['Longitude'] ? parseFloat(r['Longitude']) : null;

    await prisma.store.upsert({
      where: { id: storeId },
      create: {
        id: storeId,
        companyId: COMPANY_ID,
        storeCode,
        storeName: r['Store Name'] || storeCode,
        city: region ? region.charAt(0).toUpperCase() + region.slice(1) : 'Unknown',
        regionId,
        storeFormat: r['Store Format'] || null,
        menuType: r['Menu Type'] || null,
        priceGroup: r['Price Group'] || null,
        latitude,
        longitude,
      },
      update: {
        storeName: r['Store Name'] || storeCode,
        regionId: regionId || undefined,
        storeFormat: r['Store Format'] || null,
        menuType: r['Menu Type'] || null,
        priceGroup: r['Price Group'] || null,
        latitude,
        longitude,
      },
    });
  }

  console.log(`  ✓ ${storeCodeToUuid.size} stores upserted`);
  return storeCodeToUuid;
}

// ════════════════════════════════════════════════════════════════
//  PHASE 2: Import manager-level employees from store mapping
// ════════════════════════════════════════════════════════════════

interface ManagerInfo {
  empId: string;
  name: string;
  designation: string;
  department: string;
  roleId: string;
}

async function importManagerEmployees(
  storeRows: Record<string, string>[],
): Promise<Map<string, string>> {
  console.log(`\n══ Phase 2: Importing manager-level employees ══`);

  // Collect unique manager-level people from store mapping
  const managers = new Map<string, ManagerInfo>();

  // ID columns → designation mapping
  const idNameMap: [string, string, string, string][] = [
    // [idCol, nameCol, designation, department]
    ['AM ID', 'AM Name', 'Area Manager', 'Operations'],
    ['HRBP 1 ID', 'HRBP 1 Name', 'HR Business Partner', 'Human Resources'],
    ['HRBP 2 ID', 'HRBP 2 Name', 'HR Business Partner', 'Human Resources'],
    ['HRBP 3 ID', 'HRBP 3 Name', 'HR Business Partner', 'Human Resources'],
    ['Trainer 1 ID', 'Trainer 1 Name', 'Trainer', 'Training'],
    ['Trainer 2 ID', 'Trainer 2 Name', 'Trainer', 'Training'],
    ['Trainer 3 ID', 'Trainer 3 Name', 'Trainer', 'Training'],
    ['Regional Trainer ID', 'Regional Trainer name', 'Regional Trainer', 'Training'],
    ['Regional HR ID', 'Regional HR Name', 'Regional HR Manager', 'Human Resources'],
    ['HR Head ID', 'HR Head Name', 'HR Head', 'Human Resources'],
  ];

  for (const r of storeRows) {
    for (const [idCol, nameCol, designation, department] of idNameMap) {
      const empId = normId(r[idCol]);
      const name = (r[nameCol] || '').trim();
      if (!empId || empId === '-' || !name || name === '-') continue;

      if (!managers.has(empId)) {
        managers.set(empId, {
          empId,
          name,
          designation,
          department,
          roleId: designation === 'Area Manager' ? ROLES.admin : ROLES.user,
        });
      }
    }
  }

  console.log(`  Found ${managers.size} unique manager-level employees`);

  const empCodeToUuid = new Map<string, string>();

  for (const [empCode, info] of managers) {
    const employeeId = uuid(`employee-${COMPANY_ID}-${empCode}`);
    empCodeToUuid.set(empCode, employeeId);

    const emailHash = createHash('md5').update(empCode).digest('hex').slice(0, 8);
    const email = `${empCode.toLowerCase()}-${emailHash}@twc.local`;

    try {
      await prisma.employee.upsert({
        where: { id: employeeId },
        create: {
          id: employeeId,
          companyId: COMPANY_ID,
          empId: empCode,
          name: info.name,
          email,
          passwordHash: DEFAULT_PASSWORD,
          department: info.department,
          designation: info.designation,
          roleId: info.roleId,
        },
        update: {
          name: info.name,
          department: info.department,
          designation: info.designation,
        },
      });
    } catch (e: any) {
      console.error(`  ✗ Failed to upsert manager ${empCode} (${info.name}): ${e.message}`);
      throw e;
    }
  }

  console.log(`  ✓ ${empCodeToUuid.size} manager employees upserted`);
  return empCodeToUuid;
}

// ════════════════════════════════════════════════════════════════
//  PHASE 3: Import store-level staff from employee-master.csv
// ════════════════════════════════════════════════════════════════

async function importStoreEmployees(
  empRows: Record<string, string>[],
  storeCodeToUuid: Map<string, string>,
  managerMap: Map<string, string>,
): Promise<Map<string, string>> {
  console.log(`\n══ Phase 3: Importing ${empRows.length} store employees ══`);

  const empCodeToUuid = new Map<string, string>(managerMap);
  let created = 0;
  let skipped = 0;

  for (const r of empRows) {
    const empCode = normId(r['Employee_Code']);
    if (!empCode) { skipped++; continue; }

    const employeeId = uuid(`employee-${COMPANY_ID}-${empCode}`);
    empCodeToUuid.set(empCode, employeeId);

    const storeCode = normId(r['Store ID']);
    const storeId = storeCodeToUuid.get(storeCode) || null;

    const emailHash = createHash('md5').update(empCode).digest('hex').slice(0, 8);
    const email = `${empCode.toLowerCase()}-${emailHash}@twc.local`;

    const designation = (r['Designation'] || '').trim();
    const department = (r['Category'] || 'Store').trim() || 'Store';

    await prisma.employee.upsert({
      where: { id: employeeId },
      create: {
        id: employeeId,
        companyId: COMPANY_ID,
        empId: empCode,
        name: (r['EmpName'] || empCode).trim(),
        email,
        passwordHash: DEFAULT_PASSWORD,
        department,
        designation: designation || null,
        storeId,
        roleId: ROLES.user,
      },
      update: {
        name: (r['EmpName'] || empCode).trim(),
        designation: designation || undefined,
        storeId: storeId || undefined,
      },
    });
    created++;
  }

  console.log(`  ✓ ${created} store employees upserted (${skipped} skipped)`);
  return empCodeToUuid;
}

// ════════════════════════════════════════════════════════════════
//  PHASE 4: Link store managers (AM) from store mapping
// ════════════════════════════════════════════════════════════════

async function linkStoreManagers(
  storeRows: Record<string, string>[],
  storeCodeToUuid: Map<string, string>,
  empCodeToUuid: Map<string, string>,
) {
  console.log(`\n══ Phase 4: Linking store employees to managers ══`);

  // For each store, find employees at that store and set their managerId to the AM
  let linked = 0;
  for (const r of storeRows) {
    const storeCode = normId(r['Store ID']);
    const amId = normId(r['AM ID']);
    const storeUuid = storeCodeToUuid.get(storeCode);
    const amUuid = empCodeToUuid.get(amId);

    if (!storeUuid || !amUuid) continue;

    // Set managerId on all employees at this store
    const result = await prisma.employee.updateMany({
      where: {
        companyId: COMPANY_ID,
        storeId: storeUuid,
        managerId: null,
      },
      data: {
        managerId: amUuid,
      },
    });
    linked += result.count;

    // Also link first trainer
    const t1Id = normId(r['Trainer 1 ID']);
    const t1Uuid = empCodeToUuid.get(t1Id);
    if (t1Uuid) {
      await prisma.employee.updateMany({
        where: {
          companyId: COMPANY_ID,
          storeId: storeUuid,
          trainerId: null,
        },
        data: {
          trainerId: t1Uuid,
        },
      });
    }
  }

  console.log(`  ✓ ${linked} employees linked to area managers`);
}

// ════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════

async function main() {
  console.log('════════════════════════════════════════════════════════');
  console.log('  Prism Platform — Master Data Import');
  console.log('════════════════════════════════════════════════════════\n');

  // Read CSVs
  console.log('Reading CSV files...');
  const storeRows = readCSV('store-mapping.csv');
  const empRows = readCSV('employee-master.csv');

  // Phase 1: Stores
  const storeCodeToUuid = await importStores(storeRows);

  // Phase 2: Manager-level employees (from store mapping)
  const managerMap = await importManagerEmployees(storeRows);

  // Phase 3: Store-level staff (from employee master)
  const empCodeToUuid = await importStoreEmployees(empRows, storeCodeToUuid, managerMap);

  // Phase 4: Link managers & trainers
  await linkStoreManagers(storeRows, storeCodeToUuid, empCodeToUuid);

  // Summary
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  Summary');
  console.log('════════════════════════════════════════════════════════');

  const storeCount = await prisma.store.count();
  const empCount = await prisma.employee.count();
  const regionCount = await prisma.region.count();
  const managedCount = await prisma.employee.count({ where: { managerId: { not: null } } });

  console.log(`  Regions:             ${regionCount}`);
  console.log(`  Stores:              ${storeCount}`);
  console.log(`  Employees:           ${empCount}`);
  console.log(`  With manager linked: ${managedCount}`);
  console.log('\n✓ Master data import complete!\n');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('Import failed:', e);
    prisma.$disconnect();
    process.exit(1);
  });
