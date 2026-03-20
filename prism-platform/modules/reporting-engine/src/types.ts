// ──────────────────────────────────────────
// Reporting Engine Types
// ──────────────────────────────────────────

export type ReportFormat = 'pdf' | 'excel' | 'csv';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  format: ReportFormat;
  entityType: string;
  columns: ReportColumn[];
}

export interface ReportColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'percentage';
  width?: number;
}

export interface ReportRequest {
  templateId: string;
  companyId: string;
  filters: Record<string, unknown>;
  format: ReportFormat;
  requestedBy: string;
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  companyId: string;
  schedule: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt: string;
}

export interface ReportOutput {
  id: string;
  requestId: string;
  format: ReportFormat;
  fileUrl: string;
  generatedAt: string;
  expiresAt: string;
}
