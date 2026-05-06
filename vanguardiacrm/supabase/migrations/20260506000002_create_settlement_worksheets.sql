CREATE TABLE IF NOT EXISTS settlement_worksheets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE UNIQUE,
  gross_settlement numeric DEFAULT 0,
  attorney_fee_percentage numeric DEFAULT 33.33,
  attorney_fee_amount numeric GENERATED ALWAYS AS (gross_settlement * attorney_fee_percentage / 100) STORED,
  litigation_costs numeric DEFAULT 0,
  case_costs numeric DEFAULT 0,
  advances_issued numeric DEFAULT 0,
  medical_bills_total numeric DEFAULT 0,
  attorney_liens numeric DEFAULT 0,
  health_insurance_subrogation numeric DEFAULT 0,
  med_pay_recovery numeric DEFAULT 0,
  net_to_client numeric GENERATED ALWAYS AS (
    gross_settlement
    - (gross_settlement * attorney_fee_percentage / 100)
    - litigation_costs
    - case_costs
    - advances_issued
    - medical_bills_total
    - attorney_liens
    - health_insurance_subrogation
    - med_pay_recovery
  ) STORED,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settlement_worksheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage settlement worksheets"
ON settlement_worksheets FOR ALL
USING (auth.role() = 'authenticated');
