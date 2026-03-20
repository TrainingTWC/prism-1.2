-- ──────────────────────────────────────────────────────────────
-- Grant anon read access for Supabase PostgREST (GitHub Pages)
-- ──────────────────────────────────────────────────────────────
-- Prisma-created tables don't automatically grant access to
-- Supabase's anon role. This migration enables read-only access
-- so the static web app can fetch data via PostgREST.
-- ──────────────────────────────────────────────────────────────

-- Ensure anon can use the public schema
GRANT USAGE ON SCHEMA public TO anon;

-- Grant SELECT on all existing tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Auto-grant SELECT on future tables too
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;

-- Disable RLS on all application tables so anon can read
ALTER TABLE IF EXISTS company DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS store DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS region DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS role DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS permission DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS role_permission DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS program DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS program_section DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS program_question DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS program_submission DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS submission_answer DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS follow_up DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS task DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scoring_rule DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS evidence DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_log DISABLE ROW LEVEL SECURITY;
