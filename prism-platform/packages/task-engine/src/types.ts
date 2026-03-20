// ──────────────────────────────────────────
// Task Engine Types
// ──────────────────────────────────────────

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'overdue';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskDefinition {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  auditId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  companyId: string;
}

export interface TaskFilter {
  companyId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  storeId?: string;
  dueBefore?: string;
  dueAfter?: string;
}

export interface TaskAssignment {
  taskId: string;
  assignedTo: string;
  assignedBy: string;
  assignedAt: string;
}
