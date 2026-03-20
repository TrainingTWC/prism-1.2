-- Create violation enums
DO $$ BEGIN
  CREATE TYPE chat_violation_type AS ENUM ('PROFANITY', 'OFFENSIVE_LANGUAGE', 'COMPETITOR_MENTION', 'OFF_TOPIC', 'CONTROVERSIAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE chat_violation_severity AS ENUM ('WARNING', 'SERIOUS', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create chat_violation table
CREATE TABLE IF NOT EXISTS chat_violation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  user_id UUID,
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(100) NOT NULL,
  original_message TEXT NOT NULL,
  censored_message TEXT NOT NULL,
  violation_type chat_violation_type NOT NULL,
  flagged_terms TEXT[] DEFAULT '{}',
  severity chat_violation_severity DEFAULT 'WARNING',
  warning_count INT DEFAULT 1,
  escalated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_violation_company ON chat_violation(company_id);
CREATE INDEX IF NOT EXISTS idx_chat_violation_company_user ON chat_violation(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_violation_company_type ON chat_violation(company_id, violation_type);
CREATE INDEX IF NOT EXISTS idx_chat_violation_created ON chat_violation(created_at);
