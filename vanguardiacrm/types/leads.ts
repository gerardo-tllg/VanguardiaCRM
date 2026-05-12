export type LeadRecord = {
  id: string;
  created_at: string;
  status: string;
  client_name: string;

  phone: string | null;
  email: string | null;

  accident_date: string | null;
  accident_type: string | null;
  accident_location: string | null;
  accident_description: string | null;

  injuries: string | null;
  ai_summary: string | null;

  raw_payload: Record<string, unknown> | null;

  lang: string | null;
  client_language: string | null;

  utm_source: string | null;
  utm_campaign: string | null;

  external_id: string | null;
  source: string | null;
  campaign_name: string | null;
  adset_name: string | null;
  ad_name: string | null;
  form_id: string | null;
  market: string | null;
  medium: string | null;

  police_report_number: string | null;

  screening_score: number | null;
  estimated_case_value: number | null;
  liability_assessment: string | null;
  injury_severity: string | null;
  ai_screening_notes: string | null;
  ai_case_type_confidence: number | null;

  assigned_to: string | null;
  case_number: string | null;
  phase: string | null;
  lead_id: string | null;

  at_fault_insurer: string | null;
  at_fault_policy_number: string | null;
  at_fault_adjuster_name: string | null;
  at_fault_adjuster_phone: string | null;
  at_fault_adjuster_email: string | null;
  at_fault_claim_number: string | null;
  at_fault_policy_limits: number | null;

  client_insurer: string | null;
  client_policy_number: string | null;
  client_claim_number: string | null;
  um_uim_limits: number | null;
  pip_med_pay_limits: number | null;

  retainer_sent_at: string | null;
  retainer_signed_at: string | null;
  retainer_document_url: string | null;
  lor_generated_at: string | null;
  lor_sent_at: string | null;
  lor_document_url: string | null;
  claim_opened_at: string | null;
  medical_referral_at: string | null;
  medical_provider: string | null;
  medical_first_appointment: string | null;
  welcome_packet_sent_at: string | null;

  source_campaign: string | null;
  source_medium: string | null;
  source_channel: string | null;

  updated_at: string | null;
  activated_at: string | null;

  lead_type: string | null;
};