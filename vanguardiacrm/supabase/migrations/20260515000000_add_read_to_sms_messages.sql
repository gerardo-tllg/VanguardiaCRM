ALTER TABLE sms_messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS sms_messages_unread_idx ON sms_messages(direction, read) WHERE read = false;
