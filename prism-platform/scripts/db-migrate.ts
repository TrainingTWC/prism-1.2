// ──────────────────────────────────────────
// Prism Platform — Database Migration Script
// ──────────────────────────────────────────

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function runMigrations() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // Ensure migrations tracking table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) NOT NULL UNIQUE,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Get already applied migrations
    const { rows: applied } = await pool.query('SELECT name FROM _migrations ORDER BY id');
    const appliedNames = new Set(applied.map((r: { name: string }) => r.name));

    // Read migration files
    const migrationsDir = join(__dirname, '..', 'database', 'migrations');
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (appliedNames.has(file)) {
        console.warn(`  Skipping: ${file} (already applied)`);
        continue;
      }

      const sql = readFileSync(join(migrationsDir, file), 'utf-8');
      console.warn(`  Applying: ${file}`);

      await pool.query('BEGIN');
      try {
        await pool.query(sql);
        await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await pool.query('COMMIT');
        console.warn(`  Applied:  ${file}`);
      } catch (err) {
        await pool.query('ROLLBACK');
        console.error(`  Failed:   ${file}`, err);
        throw err;
      }
    }

    console.warn('All migrations applied successfully.');
  } finally {
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
