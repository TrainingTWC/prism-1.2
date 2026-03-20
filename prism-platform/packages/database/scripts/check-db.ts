import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function go() {
  const co = await p.company.findFirst();
  console.log('Company:', co?.name, '(', co?.slug, ')');
  console.log('Regions:', await p.region.count());
  console.log('Stores:', await p.store.count());
  console.log('Employees:', await p.employee.count());
  console.log('Programs:', await p.program.count());
  console.log('Sections:', await p.programSection.count());
  console.log('Questions:', await p.programQuestion.count());
  console.log('Roles:', await p.role.count());

  const roles = await p.role.findMany({
    select: { name: true, _count: { select: { employees: true } } },
  });
  roles.forEach((r) => console.log('  Role', r.name, ':', r._count.employees, 'employees'));

  const activeProgs = await p.program.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, type: true },
  });
  console.log(`\nActive programs (${activeProgs.length}):`);
  activeProgs.forEach((pr) => console.log(' ', pr.name, '(', pr.type, ')'));

  await p.$disconnect();
}

go();
