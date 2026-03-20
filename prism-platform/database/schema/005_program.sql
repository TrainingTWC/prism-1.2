-- ──────────────────────────────────────────
-- Prism Platform — Program Tables
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS program (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  type          VARCHAR(50) NOT NULL,
  department    VARCHAR(100),
  status        VARCHAR(20) NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'active', 'archived')),
  scoring_config JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_section (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id    UUID NOT NULL REFERENCES program(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  "order"       INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_question (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id        UUID NOT NULL REFERENCES program_section(id) ON DELETE CASCADE,
  question_type     VARCHAR(30) NOT NULL
                    CHECK (question_type IN (
                      'text', 'number', 'yes_no', 'dropdown',
                      'multiple_choice', 'image_upload', 'file_upload',
                      'rating_scale', 'signature'
                    )),
  text              TEXT NOT NULL,
  weight            NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  required          BOOLEAN NOT NULL DEFAULT FALSE,
  options           JSONB DEFAULT '[]',
  conditional_logic JSONB,
  rating_scale      JSONB,
  "order"           INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_program_company ON program(company_id);
CREATE INDEX idx_program_status ON program(status);
CREATE INDEX idx_program_section_program ON program_section(program_id);
CREATE INDEX idx_program_question_section ON program_question(section_id);
