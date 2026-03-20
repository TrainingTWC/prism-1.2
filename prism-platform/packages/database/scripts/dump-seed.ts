import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const regions = await prisma.region.findMany();
  console.log('Regions:', JSON.stringify(regions.map(x => ({ id: x.id, name: x.name }))));

  const stores = await prisma.store.findMany();
  console.log('Stores:', JSON.stringify(stores.map(x => ({ id: x.id, name: x.storeName, code: x.storeCode }))));

  const employees = await prisma.employee.findMany({ take: 10 });
  console.log('Employees:', JSON.stringify(employees.map(x => ({ id: x.id, empId: x.empId, name: x.name, roleId: x.roleId }))));

  const roles = await prisma.role.findMany();
  console.log('Roles:', JSON.stringify(roles.map(x => ({ id: x.id, name: x.name }))));
}

main().then(() => prisma.$disconnect());
