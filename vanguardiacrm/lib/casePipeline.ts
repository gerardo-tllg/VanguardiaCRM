import { CaseStatus, StatusTrigger } from '@/types/case'

export type PipelinePhase = {
  status: CaseStatus
  label: string
  triggers: StatusTrigger[]
  automationAction: string | null
}

export const PIPELINE: PipelinePhase[] = [
  {
    status: 'intake',
    label: 'Intake',
    triggers: [
      { key: 'signed_retainer', label: 'Signed Retainer', phase: 'intake' },
      { key: 'intake_form_complete', label: 'Intake Form Complete', phase: 'intake' },
      { key: 'conflict_check_clear', label: 'Conflict Check Clear', phase: 'intake' },
    ],
    automationAction: 'Send welcome SMS + intake packet',
  },
  {
    status: 'treatment',
    label: 'Treatment',
    triggers: [
      { key: 'first_medical_appointment_confirmed', label: 'First Medical Appointment Confirmed', phase: 'treatment' },
      { key: 'treating_physician_assigned', label: 'Treating Physician Assigned', phase: 'treatment' },
    ],
    automationAction: 'Send treatment check-in SMS every 30 days',
  },
  {
    status: 'demand',
    label: 'Demand',
    triggers: [
      { key: 'mmi_reached', label: 'MMI Reached', phase: 'demand' },
      { key: 'medical_records_received', label: 'Medical Records Received', phase: 'demand' },
      { key: 'bills_compiled', label: 'Bills Compiled', phase: 'demand' },
    ],
    automationAction: 'Send demand preparation notification',
  },
  {
    status: 'negotiation',
    label: 'Negotiation',
    triggers: [
      { key: 'demand_sent', label: 'Demand Sent', phase: 'negotiation' },
      { key: 'adjuster_response_received', label: 'Adjuster Response Received', phase: 'negotiation' },
    ],
    automationAction: 'Send negotiation update SMS',
  },
  {
    status: 'settlement',
    label: 'Settlement',
    triggers: [
      { key: 'settlement_offer_accepted', label: 'Settlement Offer Accepted', phase: 'settlement' },
      { key: 'settlement_agreement_signed', label: 'Settlement Agreement Signed', phase: 'settlement' },
    ],
    automationAction: 'Send settlement congratulations + next steps SMS',
  },
  {
    status: 'litigation',
    label: 'Litigation',
    triggers: [
      { key: 'suit_filed', label: 'Suit Filed', phase: 'litigation' },
      { key: 'case_referred_to_litigation', label: 'Case Referred to Litigation', phase: 'litigation' },
    ],
    automationAction: 'Send litigation update SMS + assign litigation attorney',
  },
  {
    status: 'closed',
    label: 'Closed',
    triggers: [
      { key: 'check_received', label: 'Check Received', phase: 'closed' },
      { key: 'disbursement_complete', label: 'Disbursement Complete', phase: 'closed' },
      { key: 'client_signed_closing_docs', label: 'Client Signed Closing Docs', phase: 'closed' },
    ],
    automationAction: 'Send closing SMS + NPS survey',
  },
  {
    status: 'archived',
    label: 'Archived',
    triggers: [
      { key: 'case_closed_30_days', label: 'Case Closed 30 Days', phase: 'archived' },
      { key: 'no_pending_actions', label: 'No Pending Actions', phase: 'archived' },
    ],
    automationAction: null,
  },
]

export const PIPELINE_ORDER: CaseStatus[] = PIPELINE.map((p) => p.status)

export function getPhaseIndex(status: CaseStatus): number {
  return PIPELINE_ORDER.indexOf(status)
}

export function getNextPhase(status: CaseStatus): PipelinePhase | null {
  const index = getPhaseIndex(status)
  return index >= 0 && index < PIPELINE.length - 1 ? PIPELINE[index + 1] : null
}
