// ──────────────────────────────────────────
// Prism Platform — Schema Initialization Script
// ──────────────────────────────────────────

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function initSchema() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // Enable UUID extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    const schemaDir = join(__dirname, '..', 'database', 'schema');
    const files = readdirSync(schemaDir)
      .filter((f) => f.endsWith('.sql') && f !== '000_init.sql')
      .sort();

    for (const file of files) {
      const sql = readFileSync(join(schemaDir, file), 'utf-8');
      console.warn(`  Executing: ${file}`);
      await pool.query(sql);
    }

    console.warn('Schema initialized successfully.');
  } catch (err) {
    console.error('Schema initialization failed:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

initSchema().catch((err) => {
  console.error('Init script failed:', err);
  process.exit(1);
});
