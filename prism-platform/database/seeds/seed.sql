-- ──────────────────────────────────────────
-- Prism Platform — Development Seed Data
-- ──────────────────────────────────────────

-- Sample Company
INSERT INTO company (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Prism Demo Company')
ON CONFLICT DO NOTHING;

-- Sample Roles
INSERT INTO role (id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000010', 'editor', 'Super Admin — full platform access'),
  ('00000000-0000-0000-0000-000000000011', 'admin', 'Company Admin — manage programs and employees'),
  ('00000000-0000-0000-0000-000000000012', 'user', 'Standard User — submit checklists and view dashboards')
ON CONFLICT DO NOTHING;

-- Sample Permissions
INSERT INTO permission (id, permission_name, description) VALUES
  ('00000000-0000-0000-0000-000000000020', 'programs.create', 'Create programs'),
  ('00000000-0000-0000-0000-000000000021', 'programs.edit', 'Edit programs'),
  ('00000000-0000-0000-0000-000000000022', 'programs.delete', 'Delete programs'),
  ('00000000-0000-0000-0000-000000000023', 'submissions.view', 'View submissions'),
  ('00000000-0000-0000-0000-000000000024', 'submissions.create', 'Create submissions'),
  ('00000000-0000-0000-0000-000000000025', 'employees.manage', 'Manage employees'),
  ('00000000-0000-0000-0000-000000000026', 'analytics.view', 'View analytics'),
  ('00000000-0000-0000-0000-000000000027', 'tasks.manage', 'Manage tasks'),
  ('00000000-0000-0000-0000-000000000028', 'settings.manage', 'Manage settings')
ON CONFLICT DO NOTHING;

-- Editor gets all permissions
INSERT INTO role_permission (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000010', id FROM permission
ON CONFLICT DO NOTHING;

-- Admin gets most permissions
INSERT INTO role_permission (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000011', id FROM permission
WHERE permission_name != 'settings.manage'
ON CONFLICT DO NOTHING;

-- User gets limited permissions
INSERT INTO role_permission (role_id, permission_id) VALUES
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000023'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000024'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000026')
ON CONFLICT DO NOTHING;

-- Sample Stores
INSERT INTO store (id, company_id, store_name, region, city) VALUES
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', 'Downtown Flagship', 'North', 'New York'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Midtown Express', 'North', 'New York'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Westside Mall', 'West', 'Los Angeles'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Lakeshore Plaza', 'Central', 'Chicago'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'Harbor Point', 'South', 'Miami')
ON CONFLICT DO NOTHING;

-- Sample Employees
INSERT INTO employee (id, company_id, emp_id, name, email, password_hash, department, designation, store_id, role_id) VALUES
  ('00000000-0000-0000-0000-000000000200', '00000000-0000-0000-0000-000000000001', 'EMP001', 'Alex Johnson', 'alex@demo.prism.app', '$2b$10$placeholder', 'Operations', 'Platform Admin', NULL, '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'EMP002', 'Sarah Chen', 'sarah@demo.prism.app', '$2b$10$placeholder', 'Operations', 'Regional Manager', NULL, '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', 'EMP003', 'Mike Torres', 'mike@demo.prism.app', '$2b$10$placeholder', 'Operations', 'Store Manager', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000012'),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', 'EMP004', 'Lisa Park', 'lisa@demo.prism.app', '$2b$10$placeholder', 'QA', 'Auditor', NULL, '00000000-0000-0000-0000-000000000012'),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000001', 'EMP005', 'James Wilson', 'james@demo.prism.app', '$2b$10$placeholder', 'Training', 'Trainer', NULL, '00000000-0000-0000-0000-000000000012')
ON CONFLICT DO NOTHING;

-- Sample Program
INSERT INTO program (id, company_id, name, type, department, status) VALUES
  ('00000000-0000-0000-0000-000000000300', '00000000-0000-0000-0000-000000000001', 'Monthly QA Audit', 'qa_audit', 'Operations', 'active'),
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000001', 'Training Assessment Q1', 'training_assessment', 'Training', 'active'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000001', 'Compliance Check', 'compliance_inspection', 'Compliance', 'draft')
ON CONFLICT DO NOTHING;
