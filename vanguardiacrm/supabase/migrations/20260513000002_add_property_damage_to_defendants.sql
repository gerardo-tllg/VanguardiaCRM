-- Run in Supabase SQL Editor: supabase/migrations/20260513000002_add_property_damage_to_defendants.sql

ALTER TABLE defendants
  ADD COLUMN IF NOT EXISTS vehicle_year TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_make TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_model TEXT,
  ADD COLUMN IF NOT EXISTS damage_description TEXT,
  ADD COLUMN IF NOT EXISTS repair_estimate NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS total_loss BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rental_coverage BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rental_daily_rate NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS property_damage_paid NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS property_damage_notes TEXT;
