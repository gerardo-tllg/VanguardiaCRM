CREATE TABLE IF NOT EXISTS sms_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number text,
  to_number text,
  body text NOT NULL,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'received')),
  twilio_sid text,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage sms messages"
ON sms_messages FOR ALL
USING (auth.role() = 'authenticated');
