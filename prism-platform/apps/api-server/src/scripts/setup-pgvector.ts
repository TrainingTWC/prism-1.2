/**
 * Setup script: Enable pgvector extension and add embedding column to company_knowledge
 * Run once: npx tsx src/scripts/setup-pgvector.ts
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const VECTOR_DIMS = 768; // gemini-embedding-001 with outputDimensionality=768

async function setup() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    console.log('🔧 Enabling pgvector extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('✅ pgvector extension enabled');

    // Drop old embedding column if exists with wrong dimensions
    console.log('🔧 Recreating embedding column...');
    await client.query('DROP INDEX IF EXISTS idx_knowledge_embedding');
    await client.query('ALTER TABLE company_knowledge DROP COLUMN IF EXISTS embedding');
    await client.query(`ALTER TABLE company_knowledge ADD COLUMN embedding vector(${VECTOR_DIMS})`);
    console.log(`✅ Embedding column added (${VECTOR_DIMS} dimensions)`);

    // Check if content_hash column already exists
    const hashCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'company_knowledge' AND column_name = 'content_hash'
    `);

    if (hashCheck.rows.length === 0) {
      console.log('🔧 Adding content_hash column (for change detection)...');
      await client.query(`
        ALTER TABLE company_knowledge 
        ADD COLUMN content_hash VARCHAR(64)
      `);
      console.log('✅ content_hash column added');
    } else {
      console.log('ℹ️  content_hash column already exists');
    }

    // Create HNSW index for fast similarity search
    console.log('🔧 Creating HNSW index for vector similarity search...');
    await client.query(`
      CREATE INDEX idx_knowledge_embedding 
      ON company_knowledge 
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
    `);
    console.log('✅ HNSW index created');

    // Create the similarity search function
    console.log('🔧 Creating similarity search function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION match_knowledge(
        query_embedding vector(${VECTOR_DIMS}),
        match_threshold float DEFAULT 0.3,
        match_count int DEFAULT 5,
        p_company_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid
      )
      RETURNS TABLE (
        id uuid,
        category text,
        title varchar(500),
        content text,
        tags text[],
        similarity float
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          ck.id,
          ck.category::text,
          ck.title,
          ck.content,
          ck.tags,
          1 - (ck.embedding <=> query_embedding) AS similarity
        FROM company_knowledge ck
        WHERE ck.company_id = p_company_id
          AND ck.is_active = true
          AND ck.embedding IS NOT NULL
          AND 1 - (ck.embedding <=> query_embedding) > match_threshold
        ORDER BY ck.embedding <=> query_embedding
        LIMIT match_count;
      END;
      $$;
    `);
    console.log('✅ Similarity search function created');

    console.log(`\n🎉 pgvector setup complete! (${VECTOR_DIMS}-dim vectors for gemini-embedding-001)`);
  } catch (err) {
    console.error('❌ Setup failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
