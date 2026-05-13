ALTER TABLE cases ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'es'));
