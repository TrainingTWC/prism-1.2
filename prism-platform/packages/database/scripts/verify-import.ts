import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  const programs = await prisma.program.findMany({
    select: {
      name: true,
      type: true,
      department: true,
      _count: { select: { sections: true } },
    },
    orderBy: { name: 'asc' },
  });

  console.log('\n📊 Programs in database:\n');
  for (const p of programs) {
    console.log(`  ${p.name} [${p.type}] — ${p._count.sections} sections (${p.department})`);
  }

  const sectionCount = await prisma.programSection.count();
  const questionCount = await prisma.programQuestion.count();

  console.log(`\n  Total programs:  ${programs.length}`);
  console.log(`  Total sections:  ${sectionCount}`);
  console.log(`  Total questions: ${questionCount}\n`);

  await prisma.$disconnect();
}

verify();
