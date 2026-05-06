export type CaseStatus =
  | 'intake'
  | 'treatment'
  | 'demand'
  | 'negotiation'
  | 'settlement'
  | 'litigation'
  | 'closed'
  | 'archived'

export type StatusTrigger = {
  key: string
  label: string
  phase: CaseStatus
}

export type AutomationAction = {
  phase: CaseStatus
  action: string | null
}

export type SettlementWorksheet = {
  id: string
  case_id: string
  gross_settlement: number
  attorney_fee_percentage: number
  attorney_fee_amount: number
  litigation_costs: number
  case_costs: number
  advances_issued: number
  medical_bills_total: number
  attorney_liens: number
  health_insurance_subrogation: number
  med_pay_recovery: number
  net_to_client: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type CaseWorkerRole =
  | 'attorney_of_record'
  | 'paralegal'
  | 'case_manager'
  | 'intake_specialist'
  | 'medical_coordinator'
  | 'negotiator'
  | 'litigation_attorney'
  | 'legal_assistant'
  | 'receptionist'
  | 'lien_negotiator'
  | 'referring_contact'

export type CaseWorker = {
  id: string
  case_id: string
  role: CaseWorkerRole
  user_name: string | null
  user_email: string | null
  user_phone: string | null
  assigned_at: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type MRIStatus = 'none' | 'ordered' | 'scheduled' | 'completed'
export type InjectionStatus = 'none' | 'recommended' | 'scheduled' | 'completed'
export type SurgeryStatus = 'none' | 'recommended' | 'scheduled' | 'completed'

export type InjuryStatus = {
  id: string
  case_id: string
  injury_description: string | null
  er_visit: boolean
  er_visit_date: string | null
  treating_physicians: string | null
  mri_status: MRIStatus
  mri_notes: string | null
  tbi_diagnosed: boolean
  tbi_notes: string | null
  injections_status: InjectionStatus
  injections_notes: string | null
  surgery_status: SurgeryStatus
  surgery_notes: string | null
  current_treatment_status: string | null
  mmi_reached: boolean
  mmi_date: string | null
  additional_notes: string | null
  created_at: string
  updated_at: string
}

export type SMSDirection = 'inbound' | 'outbound'
export type SMSStatus = 'sent' | 'delivered' | 'failed' | 'received'

export type SMSMessage = {
  id: string
  case_id: string
  direction: SMSDirection
  from_number: string | null
  to_number: string | null
  body: string
  status: SMSStatus
  twilio_sid: string | null
  sent_at: string
  created_at: string
}

export type Defendant = {
  id: string
  case_id: string
  defendant_name: string | null
  defendant_address: string | null
  insurance_carrier: string | null
  adjuster_name: string | null
  adjuster_phone: string | null
  adjuster_email: string | null
  claim_number: string | null
  policy_limits: number | null
  bi_limits: number | null
  um_uim_limits: number | null
  med_pay_limits: number | null
  property_damage_limits: number | null
  notes: string | null
  created_at: string
  updated_at: string
}
