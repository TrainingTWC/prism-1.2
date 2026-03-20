-- ──────────────────────────────────────────
-- Prism Platform — Initial Migration
-- ──────────────────────────────────────────
-- Migration: 001_initial
-- Description: Create all base tables
-- ──────────────────────────────────────────

-- This migration runs the full initial schema.
-- See database/schema/ for individual table definitions.

-- Track migration
CREATE TABLE IF NOT EXISTS _migrations (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO _migrations (name) VALUES ('001_initial')
ON CONFLICT (name) DO NOTHING;
