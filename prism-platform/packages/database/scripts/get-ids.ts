import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const emp = await prisma.employee.findFirst({
    where: { isActive: true, storeId: { not: null } },
    select: { id: true, name: true, empId: true, storeId: true, email: true },
  });
  console.log('Employee:', JSON.stringify(emp));

  if (emp?.storeId) {
    const store = await prisma.store.findUnique({
      where: { id: emp.storeId },
      select: { id: true, storeName: true, storeCode: true },
    });
    console.log('Store:', JSON.stringify(store));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
