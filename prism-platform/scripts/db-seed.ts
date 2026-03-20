// ──────────────────────────────────────────
// Prism Platform — Database Seed Script
// ──────────────────────────────────────────

import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function runSeed() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    const seedFile = join(__dirname, '..', 'database', 'seeds', 'seed.sql');
    const sql = readFileSync(seedFile, 'utf-8');

    console.warn('Seeding database...');
    await pool.query(sql);
    console.warn('Database seeded successfully.');
  } catch (err) {
    console.error('Seed failed:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

runSeed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
