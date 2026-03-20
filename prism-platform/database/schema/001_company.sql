-- ──────────────────────────────────────────
-- Prism Platform — Company Table
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS company (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  logo          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_company_name ON company(name);
