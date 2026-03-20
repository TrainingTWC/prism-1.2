// ──────────────────────────────────────────
// Prism Web App — Shared Types
// ──────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  logo: string | null;
  createdAt: string;
}

export interface Store {
  id: string;
  companyId: string;
  storeName: string;
  region: string;
  city: string;
}

export interface Employee {
  id: string;
  companyId: string;
  empId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  storeId: string | null;
  managerId: string | null;
  trainerId: string | null;
  roleId: string;
}

export interface Program {
  id: string;
  companyId: string;
  name: string;
  type: string;
  department: string;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
}

export interface ProgramSubmission {
  id: string;
  programId: string;
  employeeId: string;
  storeId: string;
  submittedAt: string;
  score: number | null;
  status: 'pending' | 'submitted' | 'reviewed';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  auditId: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  channel: 'in_app' | 'email' | 'whatsapp';
  status: 'pending' | 'sent' | 'read';
  createdAt: string;
}
