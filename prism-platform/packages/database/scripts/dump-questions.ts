import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const programs = await prisma.program.findMany({
    where: {
      name: {
        in: [
          'Operations Audit',
          'HR Connect',
          'SHLP Assessment',
          'Campus Hiring Assessment',
          'Training Assessment',
        ],
      },
    },
    include: {
      sections: {
        include: {
          questions: { orderBy: { order: 'asc' } },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  for (const prog of programs) {
    console.log(`\n═══ ${prog.name} (id: ${prog.id}) ═══`);
    console.log(`Sections: ${prog.sections.length}`);
    for (const sec of prog.sections) {
      console.log(`  Section ${sec.order}: ${sec.name} (${sec.questions.length} questions) [id: ${sec.id}]`);
      for (const q of sec.questions) {
        console.log(`    Q${q.order}: [${q.type}] ${q.text.substring(0, 100)}${q.text.length > 100 ? '...' : ''} [id: ${q.id}]`);
      }
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
