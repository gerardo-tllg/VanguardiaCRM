-- Add case status pipeline columns to cases table
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS case_status text DEFAULT 'intake',
  ADD COLUMN IF NOT EXISTS automation_phase text DEFAULT 'intake',
  ADD COLUMN IF NOT EXISTS last_status_change timestamptz,
  ADD COLUMN IF NOT EXISTS next_follow_up timestamptz,
  ADD COLUMN IF NOT EXISTS status_triggers jsonb DEFAULT '[]';
