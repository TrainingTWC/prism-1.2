-- ──────────────────────────────────────────
-- Prism Platform — Notification Table
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES employee(id),
  type          VARCHAR(50) NOT NULL,
  message       TEXT NOT NULL,
  channel       VARCHAR(20) NOT NULL DEFAULT 'in_app'
                CHECK (channel IN ('in_app', 'email', 'whatsapp')),
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at       TIMESTAMPTZ
);

CREATE INDEX idx_notification_user ON notification(user_id);
CREATE INDEX idx_notification_status ON notification(status);
CREATE INDEX idx_notification_company ON notification(company_id);
CREATE INDEX idx_notification_created ON notification(created_at);
