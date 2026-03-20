// ──────────────────────────────────────────
// @prism/database — Seed Script
// ──────────────────────────────────────────
//
// Seeds the database with development data.
// Run: pnpm --filter @prism/database db:seed
// ──────────────────────────────────────────

import { PrismaClient, ProgramStatus, ProgramType, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.warn('🌱 Seeding database...');

  // ── Company ──
  const company = await prisma.company.upsert({
    where: { slug: 'hbpl' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'HBPL',
      slug: 'hbpl',
      settings: { timezone: 'Asia/Kolkata', currency: 'INR' },
    },
  });

  // ── Roles ──
  const editorRole = await prisma.role.upsert({
    where: { name: 'editor' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      name: 'editor',
      description: 'Super Admin — full platform access',
      isSystem: true,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      name: 'admin',
      description: 'Company Admin — manage programs and employees',
      isSystem: true,
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000012',
      name: 'user',
      description: 'Standard User — submit checklists and view dashboards',
      isSystem: true,
    },
  });

  // ── Permissions ──
  const permissionDefs = [
    { id: '00000000-0000-0000-0000-000000000020', permissionName: 'programs.create', module: 'programs' },
    { id: '00000000-0000-0000-0000-000000000021', permissionName: 'programs.edit', module: 'programs' },
    { id: '00000000-0000-0000-0000-000000000022', permissionName: 'programs.delete', module: 'programs' },
    { id: '00000000-0000-0000-0000-000000000023', permissionName: 'programs.view', module: 'programs' },
    { id: '00000000-0000-0000-0000-000000000024', permissionName: 'submissions.create', module: 'submissions' },
    { id: '00000000-0000-0000-0000-000000000025', permissionName: 'submissions.view', module: 'submissions' },
    { id: '00000000-0000-0000-0000-000000000026', permissionName: 'employees.manage', module: 'employees' },
    { id: '00000000-0000-0000-0000-000000000027', permissionName: 'analytics.view', module: 'analytics' },
    { id: '00000000-0000-0000-0000-000000000028', permissionName: 'tasks.manage', module: 'tasks' },
    { id: '00000000-0000-0000-0000-000000000029', permissionName: 'settings.manage', module: 'settings' },
    { id: '00000000-0000-0000-0000-00000000002a', permissionName: 'notifications.manage', module: 'notifications' },
    { id: '00000000-0000-0000-0000-00000000002b', permissionName: 'files.upload', module: 'files' },
  ];

  for (const p of permissionDefs) {
    await prisma.permission.upsert({
      where: { permissionName: p.permissionName },
      update: {},
      create: p,
    });
  }

  // Editor → all permissions
  for (const p of permissionDefs) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: editorRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: editorRole.id, permissionId: p.id },
    });
  }

  // Admin → everything except settings.manage
  for (const p of permissionDefs.filter((x) => x.permissionName !== 'settings.manage')) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: p.id },
    });
  }

  // User → limited
  const userPerms = ['programs.view', 'submissions.create', 'submissions.view', 'analytics.view', 'files.upload'];
  for (const name of userPerms) {
    const perm = permissionDefs.find((x) => x.permissionName === name)!;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: userRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: userRole.id, permissionId: perm.id },
    });
  }

  // ── Regions ──
  const regions = [
    { id: '00000000-0000-0000-0000-000000000050', name: 'North', code: 'NORTH' },
    { id: '00000000-0000-0000-0000-000000000051', name: 'South', code: 'SOUTH' },
    { id: '00000000-0000-0000-0000-000000000052', name: 'West', code: 'WEST' },
    { id: '00000000-0000-0000-0000-000000000053', name: 'Central', code: 'CENTRAL' },
    { id: '00000000-0000-0000-0000-000000000054', name: 'Rest Of South', code: 'REST_OF_SOUTH' },
  ];

  for (const r of regions) {
    await prisma.region.upsert({
      where: { companyId_name: { companyId: company.id, name: r.name } },
      update: {},
      create: { ...r, companyId: company.id },
    });
  }

  // ── Stores ──
  const stores = [
    { id: '00000000-0000-0000-0000-000000000100', storeName: 'Downtown Flagship', storeCode: 'NYC-001', city: 'New York', regionId: regions[0].id },
    { id: '00000000-0000-0000-0000-000000000101', storeName: 'Midtown Express', storeCode: 'NYC-002', city: 'New York', regionId: regions[0].id },
    { id: '00000000-0000-0000-0000-000000000102', storeName: 'Westside Mall', storeCode: 'LA-001', city: 'Los Angeles', regionId: regions[2].id },
    { id: '00000000-0000-0000-0000-000000000103', storeName: 'Lakeshore Plaza', storeCode: 'CHI-001', city: 'Chicago', regionId: regions[3].id },
    { id: '00000000-0000-0000-0000-000000000104', storeName: 'Harbor Point', storeCode: 'MIA-001', city: 'Miami', regionId: regions[1].id },
  ];

  for (const s of stores) {
    await prisma.store.upsert({
      where: { companyId_storeCode: { companyId: company.id, storeCode: s.storeCode } },
      update: {},
      create: { ...s, companyId: company.id },
    });
  }

  // ── Employees ──
  const passwordPlaceholder = '$2b$10$placeholder.hash.for.dev.seed.only';

  const employees = [
    { id: '00000000-0000-0000-0000-000000000200', empId: 'EMP001', name: 'Alex Johnson', email: 'alex@demo.prism.app', department: 'Operations', designation: 'Platform Admin', storeId: null, roleId: editorRole.id },
    { id: '00000000-0000-0000-0000-000000000201', empId: 'EMP002', name: 'Sarah Chen', email: 'sarah@demo.prism.app', department: 'Operations', designation: 'Regional Manager', storeId: null, roleId: adminRole.id },
    { id: '00000000-0000-0000-0000-000000000202', empId: 'EMP003', name: 'Mike Torres', email: 'mike@demo.prism.app', department: 'Operations', designation: 'Store Manager', storeId: stores[0].id, roleId: userRole.id },
    { id: '00000000-0000-0000-0000-000000000203', empId: 'EMP004', name: 'Lisa Park', email: 'lisa@demo.prism.app', department: 'QA', designation: 'Auditor', storeId: null, roleId: userRole.id },
    { id: '00000000-0000-0000-0000-000000000204', empId: 'EMP005', name: 'James Wilson', email: 'james@demo.prism.app', department: 'Training', designation: 'Trainer', storeId: null, roleId: userRole.id },
  ];

  for (const e of employees) {
    await prisma.employee.upsert({
      where: { companyId_empId: { companyId: company.id, empId: e.empId } },
      update: {},
      create: { ...e, companyId: company.id, passwordHash: passwordPlaceholder },
    });
  }

  // ── Programs with Sections and Questions ──

  // Program 1 — QA Audit
  const qaAudit = await prisma.program.upsert({
    where: { id: '00000000-0000-0000-0000-000000000300' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000300',
      companyId: company.id,
      name: 'Monthly QA Audit',
      type: ProgramType.QA_AUDIT,
      department: 'Operations',
      status: ProgramStatus.ACTIVE,
      scoringEnabled: true,
      geoLocationEnabled: true,
      imageUploadEnabled: true,
      scoringConfig: {
        weightedSections: true,
        passingScore: 70,
        maxScore: 100,
      },
    },
  });

  // QA Audit — Section: Cleanliness
  const cleanlinessSection = await prisma.programSection.upsert({
    where: { id: '00000000-0000-0000-0000-000000000400' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000400',
      programId: qaAudit.id,
      title: 'Cleanliness & Hygiene',
      order: 1,
      weight: 0.35,
    },
  });

  // Questions for Cleanliness
  await prisma.programQuestion.upsert({
    where: { id: '00000000-0000-0000-0000-000000000500' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000500',
      sectionId: cleanlinessSection.id,
      questionType: QuestionType.YES_NO,
      text: 'Are all surfaces clean and sanitized?',
      weight: 10,
      required: true,
      allowImages: true,
      allowComments: true,
      order: 1,
    },
  });

  await prisma.programQuestion.upsert({
    where: { id: '00000000-0000-0000-0000-000000000501' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000501',
      sectionId: cleanlinessSection.id,
      questionType: QuestionType.IMAGE_UPLOAD,
      text: 'Upload photo evidence of any cleanliness issues',
      weight: 0,
      required: false,
      allowAnnotation: true,
      order: 2,
      conditionalLogic: {
        dependsOn: '00000000-0000-0000-0000-000000000500',
        condition: 'equals',
        value: false,
      },
    },
  });

  await prisma.programQuestion.upsert({
    where: { id: '00000000-0000-0000-0000-000000000502' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000502',
      sectionId: cleanlinessSection.id,
      questionType: QuestionType.RATING_SCALE,
      text: 'Rate overall floor cleanliness',
      weight: 10,
      required: true,
      ratingScale: { min: 1, max: 5, labels: { 1: 'Poor', 3: 'Acceptable', 5: 'Excellent' } },
      order: 3,
    },
  });

  await prisma.programQuestion.upsert({
    where: { id: '00000000-0000-0000-0000-000000000503' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000503',
      sectionId: cleanlinessSection.id,
      questionType: QuestionType.DROPDOWN,
      text: 'Restroom condition',
      weight: 10,
      required: true,
      options: ['Excellent', 'Good', 'Needs Improvement', 'Unacceptable'],
      order: 4,
    },
  });

  // QA Audit — Section: Equipment
  const equipmentSection = await prisma.programSection.upsert({
    where: { id: '00000000-0000-0000-0000-000000000401' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000401',
      programId: qaAudit.id,
      title: 'Equipment & Maintenance',
      order: 2,
      weight: 0.30,
    },
  });

  await prisma.programQuestion.upsert({
    where: { id: '00000000-0000-0000-0000-000000000510' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000510',
      sectionId: equipmentSection.id,
      questionType: QuestionType.MULTIPLE_CHOICE,
      text: 'Which equipment needs maintenance?',
      weight: 15,
      required: false,
      options: ['Espresso Machine', 'Grinder', 'Refrigerator', 'Dishwasher', 'HVAC', 'None'],
      order: 1,
    },
  });

  await prisma.programQuestion.upsert({
    where: { id: '00000000-0000-0000-0000-000000000511' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000511',
      sectionId: equipmentSection.id,
      questionType: QuestionType.NUMBER,
      text: 'How many equipment items are non-functional?',
      weight: 5,
      required: true,
      minValue: 0,
      maxValue: 50,
      order: 2,
    },
  });

  // QA Audit — Section: Beverage Quality
  const beverageSection = await prisma.programSection.upsert({
    where: { id: '00000000-0000-0000-0000-000000000402' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000402',
      programId: qaAudit.id,
      title: 'Beverage Quality',
      order: 3,
      weight: 0.35,
    },
  });

  await prisma.programQuestion.upsert({
    where: { id: '00000000-0000-0000-0000-000000000520' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000520',
      sectionId: beverageSection.id,
      questionType: QuestionType.TEXT,
      text: 'Describe any beverage quality concerns',
      weight: 0,
      required: false,
      allowComments: true,
      maxLength: 1000,
      order: 1,
    },
  });

  await prisma.programQuestion.upsert({
    where: { id: '00000000-0000-0000-0000-000000000521' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000521',
      sectionId: beverageSection.id,
      questionType: QuestionType.SIGNATURE,
      text: 'Auditor signature',
      weight: 0,
      required: true,
      order: 2,
    },
  });

  // Program 2 — Training Assessment
  await prisma.program.upsert({
    where: { id: '00000000-0000-0000-0000-000000000301' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000301',
      companyId: company.id,
      name: 'Training Assessment Q1',
      type: ProgramType.TRAINING_ASSESSMENT,
      department: 'Training',
      status: ProgramStatus.ACTIVE,
      scoringEnabled: true,
    },
  });

  // Program 3 — Compliance Inspection (draft)
  await prisma.program.upsert({
    where: { id: '00000000-0000-0000-0000-000000000302' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000302',
      companyId: company.id,
      name: 'Compliance Inspection',
      type: ProgramType.COMPLIANCE_INSPECTION,
      department: 'Compliance',
      status: ProgramStatus.DRAFT,
      scoringEnabled: true,
      signatureEnabled: true,
      geoLocationEnabled: true,
    },
  });

  // Program 4 — Competition
  await prisma.program.upsert({
    where: { id: '00000000-0000-0000-0000-000000000303' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000303',
      companyId: company.id,
      name: 'Barista Championship 2026',
      type: ProgramType.COMPETITION_SCORING,
      department: 'Operations',
      status: ProgramStatus.ACTIVE,
      scoringEnabled: true,
      imageUploadEnabled: true,
    },
  });

  console.warn('✅ Seed complete.');
}

main()
  .then(() => { console.log('Main resolved'); })
  .catch((e) => {
    console.error('❌ Seed failed:');
    console.error(String(e));
    if (e.stack) console.error(e.stack);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
