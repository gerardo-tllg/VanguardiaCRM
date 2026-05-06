CREATE TABLE IF NOT EXISTS injury_status (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE UNIQUE,
  injury_description text,
  er_visit boolean DEFAULT false,
  er_visit_date date,
  treating_physicians text,
  mri_status text DEFAULT 'none' CHECK (mri_status IN ('none', 'ordered', 'scheduled', 'completed')),
  mri_notes text,
  tbi_diagnosed boolean DEFAULT false,
  tbi_notes text,
  injections_status text DEFAULT 'none' CHECK (injections_status IN ('none', 'recommended', 'scheduled', 'completed')),
  injections_notes text,
  surgery_status text DEFAULT 'none' CHECK (surgery_status IN ('none', 'recommended', 'scheduled', 'completed')),
  surgery_notes text,
  current_treatment_status text,
  mmi_reached boolean DEFAULT false,
  mmi_date date,
  additional_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE injury_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage injury status"
ON injury_status FOR ALL
USING (auth.role() = 'authenticated');
