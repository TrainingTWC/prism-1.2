-- ──────────────────────────────────────────
-- Prism Platform — Submission Tables
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS program_submission (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id    UUID NOT NULL REFERENCES program(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES employee(id),
  store_id      UUID NOT NULL REFERENCES store(id),
  score         NUMERIC(7,2),
  max_score     NUMERIC(7,2),
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'submitted', 'reviewed')),
  geo_lat       DOUBLE PRECISION,
  geo_lng       DOUBLE PRECISION,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   UUID REFERENCES employee(id)
);

CREATE TABLE IF NOT EXISTS program_response (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES program_submission(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES program_question(id),
  answer          TEXT,
  image_url       TEXT,
  file_url        TEXT,
  geo_lat         DOUBLE PRECISION,
  geo_lng         DOUBLE PRECISION,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submission_program ON program_submission(program_id);
CREATE INDEX idx_submission_employee ON program_submission(employee_id);
CREATE INDEX idx_submission_store ON program_submission(store_id);
CREATE INDEX idx_submission_status ON program_submission(status);
CREATE INDEX idx_submission_date ON program_submission(submitted_at);
CREATE INDEX idx_response_submission ON program_response(submission_id);
CREATE INDEX idx_response_question ON program_response(question_id);
