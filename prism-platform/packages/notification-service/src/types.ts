// ──────────────────────────────────────────
// Notification Service Types
// ──────────────────────────────────────────

export type NotificationChannel = 'in_app' | 'email' | 'whatsapp';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export type NotificationTrigger =
  | 'submission_created'
  | 'task_assigned'
  | 'task_overdue'
  | 'report_ready'
  | 'score_alert';

export interface NotificationPayload {
  userId: string;
  channel: NotificationChannel;
  trigger: NotificationTrigger;
  templateId: string;
  data: Record<string, string>;
}

export interface NotificationTemplate {
  id: string;
  trigger: NotificationTrigger;
  channel: NotificationChannel;
  subject?: string; // email only
  body: string;
  variables: string[];
}
