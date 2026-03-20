import { PrismaClient } from '@prisma/client';
const p = new PrismaClient({ log: ['error'] });

async function test() {
  try {
    const c = await p.company.upsert({
      where: { slug: 'hbpl' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'HBPL',
        slug: 'hbpl',
        settings: { timezone: 'Asia/Kolkata', currency: 'INR' },
      },
    });
    console.log('Company OK:', c.name);
  } catch (e: any) {
    console.error('Company FAILED:', e.message);
  }
  await p.$disconnect();
}

test();
