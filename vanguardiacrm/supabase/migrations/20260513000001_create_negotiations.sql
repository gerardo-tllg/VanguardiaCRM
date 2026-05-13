-- Run in Supabase SQL Editor: supabase/migrations/20260513000001_create_negotiations.sql

CREATE TABLE IF NOT EXISTS negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  offer_date DATE NOT NULL,
  offer_by TEXT NOT NULL CHECK (offer_by IN ('insurance', 'firm')),
  amount NUMERIC(12,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS negotiations_case_id_idx ON negotiations(case_id);

ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage negotiations" ON negotiations
  FOR ALL USING (auth.role() = 'authenticated');
