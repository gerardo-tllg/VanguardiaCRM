CREATE TABLE IF NOT EXISTS defendants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  defendant_name text,
  defendant_address text,
  insurance_carrier text,
  adjuster_name text,
  adjuster_phone text,
  adjuster_email text,
  claim_number text,
  policy_limits numeric,
  bi_limits numeric,
  um_uim_limits numeric,
  med_pay_limits numeric,
  property_damage_limits numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE defendants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage defendants"
ON defendants FOR ALL
USING (auth.role() = 'authenticated');
