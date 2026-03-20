-- ──────────────────────────────────────────
-- Prism Platform — Full Schema Initialization
-- ──────────────────────────────────────────
-- Run this file to create all tables in order.
-- ──────────────────────────────────────────

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\i 001_company.sql
\i 002_store.sql
\i 003_role_permission.sql
\i 004_employee.sql
\i 005_program.sql
\i 006_submission.sql
\i 007_task.sql
\i 008_notification.sql
