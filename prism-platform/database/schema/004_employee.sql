-- ──────────────────────────────────────────
-- Prism Platform — Employee Table
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS employee (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  emp_id        VARCHAR(50) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  department    VARCHAR(100),
  designation   VARCHAR(100),
  store_id      UUID REFERENCES store(id) ON DELETE SET NULL,
  manager_id    UUID REFERENCES employee(id) ON DELETE SET NULL,
  trainer_id    UUID REFERENCES employee(id) ON DELETE SET NULL,
  role_id       UUID NOT NULL REFERENCES role(id),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(company_id, emp_id),
  UNIQUE(company_id, email)
);

CREATE INDEX idx_employee_company ON employee(company_id);
CREATE INDEX idx_employee_store ON employee(store_id);
CREATE INDEX idx_employee_manager ON employee(manager_id);
CREATE INDEX idx_employee_role ON employee(role_id);
CREATE INDEX idx_employee_department ON employee(department);
