/**
 * fix-departments.ts
 * 
 * Cross-references store mapping fields (trainer, hrbp, am, regional)
 * with the employee table and updates department + designation accordingly.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MappingEntry {
  empId: string;
  correctDepartment: string;
  correctDesignation: string;
  source: string; // which store field it came from
}

async function main() {
  console.log('=== Store Mapping → Employee Department Sync ===\n');

  // 1. Get all stores with mapping fields
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    select: {
      storeName: true,
      storeCode: true,
      amId: true,
      amName: true,
      hrbp1Id: true, hrbp1Name: true,
      hrbp2Id: true, hrbp2Name: true,
      hrbp3Id: true, hrbp3Name: true,
      trainer1Id: true, trainer1Name: true,
      trainer2Id: true, trainer2Name: true,
      trainer3Id: true, trainer3Name: true,
      regionalTrainerId: true, regionalTrainerName: true,
      regionalHrId: true, regionalHrName: true,
      hrHeadId: true, hrHeadName: true,
    },
  });

  // 2. Build a map: empId → { correctDepartment, correctDesignation, source }
  // If the same empId appears in multiple roles, the FIRST one wins (we track all for logging)
  const mappings = new Map<string, MappingEntry>();

  for (const s of stores) {
    const storeLabel = `${s.storeName} (${s.storeCode || 'no code'})`;

    // Area Managers → Operations
    if (s.amId) {
      if (!mappings.has(s.amId.toUpperCase())) {
        mappings.set(s.amId.toUpperCase(), {
          empId: s.amId.toUpperCase(),
          correctDepartment: 'Operations',
          correctDesignation: 'Area Manager',
          source: `AM @ ${storeLabel}`,
        });
      }
    }

    // HRBPs → HR
    for (const [idField, nameField] of [
      [s.hrbp1Id, s.hrbp1Name],
      [s.hrbp2Id, s.hrbp2Name],
      [s.hrbp3Id, s.hrbp3Name],
    ] as [string | null, string | null][]) {
      if (idField) {
        if (!mappings.has(idField.toUpperCase())) {
          mappings.set(idField.toUpperCase(), {
            empId: idField.toUpperCase(),
            correctDepartment: 'HR',
            correctDesignation: 'HRBP',
            source: `HRBP @ ${storeLabel}`,
          });
        }
      }
    }

    // Trainers → Training
    for (const [idField, nameField] of [
      [s.trainer1Id, s.trainer1Name],
      [s.trainer2Id, s.trainer2Name],
      [s.trainer3Id, s.trainer3Name],
    ] as [string | null, string | null][]) {
      if (idField) {
        if (!mappings.has(idField.toUpperCase())) {
          mappings.set(idField.toUpperCase(), {
            empId: idField.toUpperCase(),
            correctDepartment: 'Training',
            correctDesignation: 'Trainer',
            source: `Trainer @ ${storeLabel}`,
          });
        }
      }
    }

    // Regional Trainer → Training
    if (s.regionalTrainerId) {
      if (!mappings.has(s.regionalTrainerId.toUpperCase())) {
        mappings.set(s.regionalTrainerId.toUpperCase(), {
          empId: s.regionalTrainerId.toUpperCase(),
          correctDepartment: 'Training',
          correctDesignation: 'Regional Trainer',
          source: `Regional Trainer @ ${storeLabel}`,
        });
      }
    }

    // Regional HR → HR
    if (s.regionalHrId) {
      if (!mappings.has(s.regionalHrId.toUpperCase())) {
        mappings.set(s.regionalHrId.toUpperCase(), {
          empId: s.regionalHrId.toUpperCase(),
          correctDepartment: 'HR',
          correctDesignation: 'Regional HR',
          source: `Regional HR @ ${storeLabel}`,
        });
      }
    }

    // HR Head → HR
    if (s.hrHeadId) {
      if (!mappings.has(s.hrHeadId.toUpperCase())) {
        mappings.set(s.hrHeadId.toUpperCase(), {
          empId: s.hrHeadId.toUpperCase(),
          correctDepartment: 'HR',
          correctDesignation: 'HR Head',
          source: `HR Head @ ${storeLabel}`,
        });
      }
    }
  }

  console.log(`Found ${mappings.size} unique employee IDs in store mappings.\n`);

  // 3. For each mapped empId, find the employee and check if dept/designation match
  const companyId = '00000000-0000-0000-0000-000000000001';
  let needsUpdate: { empId: string; name: string; currentDept: string | null; currentDesig: string | null; newDept: string; newDesig: string; source: string }[] = [];
  let alreadyCorrect = 0;
  let notFound = 0;

  for (const [key, mapping] of mappings) {
    const emp = await prisma.employee.findFirst({
      where: {
        companyId,
        empId: { equals: mapping.empId, mode: 'insensitive' },
      },
      select: { id: true, empId: true, name: true, department: true, designation: true },
    });

    if (!emp) {
      console.log(`  NOT FOUND: ${mapping.empId} — mapped as ${mapping.source}`);
      notFound++;
      continue;
    }

    const deptMatch = emp.department?.toLowerCase() === mapping.correctDepartment.toLowerCase();
    const desigMatch = emp.designation?.toLowerCase() === mapping.correctDesignation.toLowerCase();

    if (deptMatch && desigMatch) {
      alreadyCorrect++;
    } else {
      needsUpdate.push({
        empId: emp.empId,
        name: emp.name,
        currentDept: emp.department,
        currentDesig: emp.designation,
        newDept: mapping.correctDepartment,
        newDesig: mapping.correctDesignation,
        source: mapping.source,
      });
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Already correct: ${alreadyCorrect}`);
  console.log(`Not found in employee DB: ${notFound}`);
  console.log(`Need update: ${needsUpdate.length}\n`);

  if (needsUpdate.length === 0) {
    console.log('Nothing to update. All departments are correct!');
    await prisma.$disconnect();
    return;
  }

  // 4. Print what we're about to change
  console.log('=== Changes to apply ===\n');
  for (const u of needsUpdate) {
    console.log(`  ${u.empId} (${u.name})`);
    console.log(`    Current:  dept="${u.currentDept}" | desig="${u.currentDesig}"`);
    console.log(`    New:      dept="${u.newDept}" | desig="${u.newDesig}"`);
    console.log(`    Source:   ${u.source}`);
    console.log('');
  }

  // 5. Apply updates
  console.log('Applying updates...\n');
  let updated = 0;
  for (const u of needsUpdate) {
    await prisma.employee.updateMany({
      where: {
        companyId,
        empId: { equals: u.empId, mode: 'insensitive' },
      },
      data: {
        department: u.newDept,
        designation: u.newDesig,
      },
    });
    updated++;
    console.log(`  ✓ ${u.empId} (${u.name}) → ${u.newDept} / ${u.newDesig}`);
  }

  console.log(`\nDone! Updated ${updated} employees.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
