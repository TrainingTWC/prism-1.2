// ──────────────────────────────────────────
// Prism API Server — Shared Types
// ──────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  logo: string | null;
  created_at: string;
}

export interface Store {
  id: string;
  company_id: string;
  store_name: string;
  region: string;
  city: string;
}

export interface Employee {
  id: string;
  company_id: string;
  emp_id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  store_id: string | null;
  manager_id: string | null;
  trainer_id: string | null;
  role_id: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface Permission {
  id: string;
  permission_name: string;
}

export interface Program {
  id: string;
  company_id: string;
  name: string;
  type: string;
  department: string;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
}

export interface ProgramSection {
  id: string;
  program_id: string;
  title: string;
  order: number;
}

export interface ProgramQuestion {
  id: string;
  section_id: string;
  question_type: string;
  text: string;
  weight: number;
  required: boolean;
  conditional_logic: Record<string, unknown> | null;
}

export interface ProgramSubmission {
  id: string;
  program_id: string;
  employee_id: string;
  store_id: string;
  submitted_at: string;
  score: number | null;
  status: 'pending' | 'submitted' | 'reviewed';
}

export interface ProgramResponse {
  id: string;
  submission_id: string;
  question_id: string;
  answer: string;
  image_url: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  audit_id: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  channel: 'in_app' | 'email' | 'whatsapp';
  status: 'pending' | 'sent' | 'read';
  created_at: string;
}
