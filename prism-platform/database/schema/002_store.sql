-- ──────────────────────────────────────────
-- Prism Platform — Store Table
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS store (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  store_name    VARCHAR(255) NOT NULL,
  region        VARCHAR(100) NOT NULL,
  city          VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_store_company ON store(company_id);
CREATE INDEX idx_store_region ON store(region);
CREATE INDEX idx_store_city ON store(city);
