CREATE TABLE IF NOT EXISTS case_workers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  role text NOT NULL,
  user_name text,
  user_email text,
  user_phone text,
  assigned_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(case_id, role)
);

ALTER TABLE case_workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage case workers"
ON case_workers FOR ALL
USING (auth.role() = 'authenticated');
