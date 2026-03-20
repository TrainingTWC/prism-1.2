-- ══════════════════════════════════════════════════════════════
-- Prism Platform — Raw SQL Migration: Initial Schema
-- ══════════════════════════════════════════════════════════════
-- This file mirrors the Prisma schema for environments where
-- Prisma Migrate cannot run directly (e.g. Supabase SQL editor).
-- The canonical source of truth is prisma/schema.prisma.
-- ══════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════  ENUMS  ═══════════════

CREATE TYPE program_status AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE program_type AS ENUM ('QA_AUDIT', 'TRAINING_ASSESSMENT', 'CAMPUS_HIRING', 'COMPLIANCE_INSPECTION', 'OPERATIONAL_SURVEY', 'COMPETITION_SCORING', 'CUSTOM');
CREATE TYPE question_type AS ENUM ('TEXT', 'NUMBER', 'YES_NO', 'DROPDOWN', 'MULTIPLE_CHOICE', 'RATING_SCALE', 'IMAGE_UPLOAD', 'FILE_UPLOAD', 'SIGNATURE');
CREATE TYPE submission_status AS ENUM ('DRAFT', 'SUBMITTED', 'SYNCED', 'REVIEWED', 'ARCHIVED');
CREATE TYPE task_status AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED');
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE notification_channel AS ENUM ('IN_APP', 'EMAIL', 'WHATSAPP');
CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');
CREATE TYPE storage_bucket AS ENUM ('AUDIT_EVIDENCE', 'ATTACHMENTS', 'DOCUMENTS', 'SIGNATURES', 'AVATARS');

-- ═══════════════  COMPANY  ═══════════════

CREATE TABLE company (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  logo        TEXT,
  domain      VARCHAR(255),
  settings    JSONB NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════  REGION  ═══════════════

CREATE TABLE region (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  name        VARCHAR(150) NOT NULL,
  code        VARCHAR(20),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(company_id, name)
);

CREATE INDEX idx_region_company ON region(company_id);

-- ═══════════════  STORE  ═══════════════

CREATE TABLE store (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  region_id   UUID REFERENCES region(id) ON DELETE SET NULL,
  store_name  VARCHAR(255) NOT NULL,
  store_code  VARCHAR(50),
  city        VARCHAR(100) NOT NULL,
  state       VARCHAR(100),
  address     TEXT,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(company_id, store_code)
);

CREATE INDEX idx_store_company ON store(company_id);
CREATE INDEX idx_store_region ON store(region_id);
CREATE INDEX idx_store_company_region ON store(company_id, region_id);
CREATE INDEX idx_store_city ON store(city);

-- ═══════════════  ROLE & PERMISSION  ═══════════════

CREATE TABLE role (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permission (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_name VARCHAR(100) NOT NULL UNIQUE,
  description     TEXT,
  module          VARCHAR(50),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_permission_module ON permission(module);

CREATE TABLE role_permission (
  role_id       UUID NOT NULL REFERENCES role(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permission_role ON role_permission(role_id);
CREATE INDEX idx_role_permission_perm ON role_permission(permission_id);

-- ═══════════════  EMPLOYEE  ═══════════════

CREATE TABLE employee (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  emp_id        VARCHAR(50) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  phone         VARCHAR(20),
  avatar        TEXT,
  department    VARCHAR(100),
  designation   VARCHAR(100),
  store_id      UUID REFERENCES store(id) ON DELETE SET NULL,
  manager_id    UUID REFERENCES employee(id) ON DELETE SET NULL,
  trainer_id    UUID REFERENCES employee(id) ON DELETE SET NULL,
  role_id       UUID NOT NULL REFERENCES role(id),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
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
CREATE INDEX idx_employee_company_active ON employee(company_id, is_active);

-- ═══════════════  PROGRAM  ═══════════════

CREATE TABLE program (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  name                 VARCHAR(255) NOT NULL,
  description          TEXT,
  type                 program_type NOT NULL DEFAULT 'CUSTOM',
  department           VARCHAR(100),
  status               program_status NOT NULL DEFAULT 'DRAFT',
  version              INTEGER NOT NULL DEFAULT 1,
  parent_id            UUID REFERENCES program(id),
  scoring_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  offline_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  image_upload_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  geo_location_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  signature_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  scoring_config       JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_program_company ON program(company_id);
CREATE INDEX idx_program_company_status ON program(company_id, status);
CREATE INDEX idx_program_company_type ON program(company_id, type);
CREATE INDEX idx_program_company_dept ON program(company_id, department);
CREATE INDEX idx_program_status ON program(status);

-- ═══════════════  PROGRAM SECTION  ═══════════════

CREATE TABLE program_section (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  UUID NOT NULL REFERENCES program(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  "order"     INTEGER NOT NULL DEFAULT 0,
  weight      DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_section_program ON program_section(program_id);
CREATE INDEX idx_section_program_order ON program_section(program_id, "order");

-- ═══════════════  PROGRAM QUESTION  ═══════════════

CREATE TABLE program_question (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id        UUID NOT NULL REFERENCES program_section(id) ON DELETE CASCADE,
  question_type     question_type NOT NULL,
  text              TEXT NOT NULL,
  description       TEXT,
  "order"           INTEGER NOT NULL DEFAULT 0,
  weight            DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  scoring_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  required          BOOLEAN NOT NULL DEFAULT FALSE,
  min_value         DOUBLE PRECISION,
  max_value         DOUBLE PRECISION,
  min_length        INTEGER,
  max_length        INTEGER,
  options           JSONB NOT NULL DEFAULT '[]',
  rating_scale      JSONB,
  allow_images      BOOLEAN NOT NULL DEFAULT FALSE,
  allow_annotation  BOOLEAN NOT NULL DEFAULT FALSE,
  allow_comments    BOOLEAN NOT NULL DEFAULT FALSE,
  conditional_logic JSONB,
  default_value     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_question_section ON program_question(section_id);
CREATE INDEX idx_question_section_order ON program_question(section_id, "order");
CREATE INDEX idx_question_type ON program_question(question_type);

-- ═══════════════  SUBMISSION  ═══════════════

CREATE TABLE program_submission (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL REFERENCES program(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES employee(id),
  store_id        UUID NOT NULL REFERENCES store(id),
  status          submission_status NOT NULL DEFAULT 'DRAFT',
  score           DOUBLE PRECISION,
  max_score       DOUBLE PRECISION,
  percentage      DOUBLE PRECISION,
  geo_lat         DOUBLE PRECISION,
  geo_lng         DOUBLE PRECISION,
  started_at      TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ,
  synced_at       TIMESTAMPTZ,
  reviewed_at     TIMESTAMPTZ,
  reviewed_by_id  UUID REFERENCES employee(id),
  is_offline      BOOLEAN NOT NULL DEFAULT FALSE,
  device_id       VARCHAR(100),
  section_scores  JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sub_program ON program_submission(program_id);
CREATE INDEX idx_sub_employee ON program_submission(employee_id);
CREATE INDEX idx_sub_store ON program_submission(store_id);
CREATE INDEX idx_sub_status ON program_submission(status);
CREATE INDEX idx_sub_submitted ON program_submission(submitted_at);
CREATE INDEX idx_sub_prog_store ON program_submission(program_id, store_id);
CREATE INDEX idx_sub_prog_date ON program_submission(program_id, submitted_at);
CREATE INDEX idx_sub_store_date ON program_submission(store_id, submitted_at);
CREATE INDEX idx_sub_prog_store_date ON program_submission(program_id, store_id, submitted_at);
CREATE INDEX idx_sub_emp_date ON program_submission(employee_id, submitted_at);

-- ═══════════════  RESPONSE  ═══════════════

CREATE TABLE program_response (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id    UUID NOT NULL REFERENCES program_submission(id) ON DELETE CASCADE,
  question_id      UUID NOT NULL REFERENCES program_question(id),
  answer           TEXT,
  numeric_value    DOUBLE PRECISION,
  boolean_value    BOOLEAN,
  selected_options JSONB,
  image_url        TEXT,
  file_url         TEXT,
  signature_url    TEXT,
  annotation       JSONB,
  comment          TEXT,
  geo_lat          DOUBLE PRECISION,
  geo_lng          DOUBLE PRECISION,
  score            DOUBLE PRECISION,
  max_score        DOUBLE PRECISION,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resp_submission ON program_response(submission_id);
CREATE INDEX idx_resp_question ON program_response(question_id);
CREATE INDEX idx_resp_sub_question ON program_response(submission_id, question_id);

-- ═══════════════  TASK  ═══════════════

CREATE TABLE task (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  assigned_to_id  UUID NOT NULL REFERENCES employee(id),
  created_by_id   UUID NOT NULL REFERENCES employee(id),
  submission_id   UUID REFERENCES program_submission(id) ON DELETE SET NULL,
  store_id        UUID REFERENCES store(id) ON DELETE SET NULL,
  status          task_status NOT NULL DEFAULT 'OPEN',
  priority        task_priority NOT NULL DEFAULT 'MEDIUM',
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_company ON task(company_id);
CREATE INDEX idx_task_assignee ON task(assigned_to_id);
CREATE INDEX idx_task_creator ON task(created_by_id);
CREATE INDEX idx_task_status ON task(status);
CREATE INDEX idx_task_priority ON task(priority);
CREATE INDEX idx_task_due ON task(due_date);
CREATE INDEX idx_task_store ON task(store_id);
CREATE INDEX idx_task_company_status ON task(company_id, status);
CREATE INDEX idx_task_company_assignee_status ON task(company_id, assigned_to_id, status);
CREATE INDEX idx_task_submission ON task(submission_id);

-- ═══════════════  TASK COMMENT  ═══════════════

CREATE TABLE task_comment (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES employee(id),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_comment_task ON task_comment(task_id);

-- ═══════════════  NOTIFICATION  ═══════════════

CREATE TABLE notification (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL,
  title       VARCHAR(255),
  message     TEXT NOT NULL,
  channel     notification_channel NOT NULL DEFAULT 'IN_APP',
  status      notification_status NOT NULL DEFAULT 'PENDING',
  metadata    JSONB NOT NULL DEFAULT '{}',
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user ON notification(user_id);
CREATE INDEX idx_notif_user_status ON notification(user_id, status);
CREATE INDEX idx_notif_company ON notification(company_id);
CREATE INDEX idx_notif_created ON notification(created_at);
CREATE INDEX idx_notif_user_created ON notification(user_id, created_at);

-- ═══════════════  FILE UPLOAD  ═══════════════

CREATE TABLE file_upload (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES employee(id),
  bucket      storage_bucket NOT NULL,
  file_name   VARCHAR(255) NOT NULL,
  file_path   TEXT NOT NULL,
  public_url  TEXT NOT NULL,
  mime_type   VARCHAR(100) NOT NULL,
  size_bytes  INTEGER NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_file_company ON file_upload(company_id);
CREATE INDEX idx_file_uploader ON file_upload(uploaded_by);
CREATE INDEX idx_file_bucket ON file_upload(bucket);
CREATE INDEX idx_file_company_bucket ON file_upload(company_id, bucket);
