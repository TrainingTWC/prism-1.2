-- ──────────────────────────────────────────
-- Prism Platform — Task Table
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS task (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  assigned_to   UUID NOT NULL REFERENCES employee(id),
  created_by    UUID NOT NULL REFERENCES employee(id),
  audit_id      UUID REFERENCES program_submission(id),
  store_id      UUID REFERENCES store(id),
  status        VARCHAR(20) NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'in_progress', 'completed', 'overdue')),
  priority      VARCHAR(10) NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  due_date      DATE,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_company ON task(company_id);
CREATE INDEX idx_task_assigned ON task(assigned_to);
CREATE INDEX idx_task_status ON task(status);
CREATE INDEX idx_task_priority ON task(priority);
CREATE INDEX idx_task_due ON task(due_date);
CREATE INDEX idx_task_store ON task(store_id);
