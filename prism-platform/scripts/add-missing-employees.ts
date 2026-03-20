import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CID = '00000000-0000-0000-0000-000000000001';

const newEmployees = [
  { empId: 'H2841', name: 'Keshav',    department: 'Operations', designation: 'Area Manager' },
  { empId: 'H3728', name: 'Siddhanth', department: 'HR',         designation: 'HRBP' },
  { empId: 'H3730', name: 'Sumanjali', department: 'HR',         designation: 'HRBP' },
  { empId: 'H3218', name: 'Upender',   department: 'Operations', designation: 'Area Manager' },
  { empId: 'H3184', name: 'Vishal',    department: 'Operations', designation: 'Market Manager' },
];

async function main() {
  // Get the 'user' role
  const role = await prisma.role.findFirst({ where: { name: 'user' } });
  if (!role) {
    // Fallback: get any role
    const anyRole = await prisma.role.findFirst();
    if (!anyRole) { console.error('No roles in DB!'); process.exit(1); }
    console.log('Using fallback role:', anyRole.name, anyRole.id);
    var roleId = anyRole.id;
  } else {
    console.log('Using role:', role.name, role.id);
    var roleId = role.id;
  }

  for (const emp of newEmployees) {
    // Check if already exists
    const existing = await prisma.employee.findFirst({
      where: { companyId: CID, empId: { equals: emp.empId, mode: 'insensitive' } },
      select: { empId: true, name: true, department: true, designation: true },
    });

    if (existing) {
      // Update department + designation + name
      await prisma.employee.updateMany({
        where: { companyId: CID, empId: { equals: emp.empId, mode: 'insensitive' } },
        data: { name: emp.name, department: emp.department, designation: emp.designation },
      });
      console.log(`UPDATED: ${emp.empId} (${emp.name}) → ${emp.department} / ${emp.designation}`);
    } else {
      // Create new employee
      const email = `${emp.empId.toLowerCase()}@hbpl.in`;
      await prisma.employee.create({
        data: {
          companyId: CID,
          empId: emp.empId.toUpperCase(),
          name: emp.name,
          email,
          passwordHash: '$2b$10$placeholder',
          department: emp.department,
          designation: emp.designation,
          roleId,
          isActive: true,
        },
      });
      console.log(`CREATED: ${emp.empId} (${emp.name}) → ${emp.department} / ${emp.designation}`);
    }
  }

  console.log('\nDone! All 5 employees added/updated.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
