'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Defendant, InjuryStatus, SettlementWorksheet, CaseWorker } from '@/types/case'

type Props = { caseId: string }

type CaseData = {
  client_name: string | null
  phone: string | null
  email: string | null
  accident_date: string | null
  accident_location: string | null
  client_role: string | null
  conditions: string | null
  accident_description: string | null
  at_fault_insurer: string | null
  at_fault_adjuster_name: string | null
  at_fault_adjuster_phone: string | null
  at_fault_adjuster_email: string | null
  at_fault_claim_number: string | null
  at_fault_policy_limits: string | null
}

type DemandLetter = {
  id: string
  case_id: string
  content: string | null
  version: number
  model: string
  generated_at: string | null
  last_saved_at: string | null
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(data: {
  caseData: CaseData | null
  defendants: Defendant[]
  injury: InjuryStatus | null
  settlement: SettlementWorksheet | null
  workers: CaseWorker[]
  demandType: 'stowers' | 'formal' | 'simple'
}): string {
  const { caseData, defendants, injury, settlement, workers, demandType } = data

  const attorney = workers.find(w => w.role === 'attorney_of_record')
  const primaryDefendant = defendants[0] || null
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const caseDataSection = `
---

CASE DATA TO USE:

Today's Date: ${today}

CLIENT:
Name: ${caseData?.client_name || 'N/A'}
Phone: ${caseData?.phone || 'N/A'}
Email: ${caseData?.email || 'N/A'}

INCIDENT:
Date of Loss: ${caseData?.accident_date || 'N/A'}
Location: ${caseData?.accident_location || 'N/A'}
Client Role: ${caseData?.client_role || 'N/A'}
Conditions: ${caseData?.conditions || 'N/A'}
Narrative: ${caseData?.accident_description || 'N/A'}

AT-FAULT PARTY / INSURANCE (FROM CASES TABLE):
Insurer: ${caseData?.at_fault_insurer || 'N/A'}
Adjuster: ${caseData?.at_fault_adjuster_name || 'N/A'}
Adjuster Phone: ${caseData?.at_fault_adjuster_phone || 'N/A'}
Adjuster Email: ${caseData?.at_fault_adjuster_email || 'N/A'}
Claim Number: ${caseData?.at_fault_claim_number || 'N/A'}
Policy Limits: ${caseData?.at_fault_policy_limits || 'N/A'}

DEFENDANT / INSURANCE:
${primaryDefendant ? `Carrier: ${primaryDefendant.insurance_carrier || 'N/A'}
Adjuster: ${primaryDefendant.adjuster_name || 'N/A'}
Adjuster Phone: ${primaryDefendant.adjuster_phone || 'N/A'}
Adjuster Fax: ${primaryDefendant.adjuster_fax || 'N/A'}
Adjuster Email: ${primaryDefendant.adjuster_email || 'N/A'}
Claim Number: ${primaryDefendant.claim_number || 'N/A'}
Policy Limit: ${primaryDefendant.policy_limits ? '$' + primaryDefendant.policy_limits.toLocaleString() : 'N/A'}
BI Limit: ${primaryDefendant.bi_limits ? '$' + primaryDefendant.bi_limits.toLocaleString() : 'N/A'}
MedPay: ${primaryDefendant.med_pay_limits ? '$' + primaryDefendant.med_pay_limits.toLocaleString() : 'N/A'}` : 'No defendant on file.'}

INJURIES:
ER Visit: ${injury?.er_visit ? 'Yes' : 'No'}
TBI: ${injury?.tbi_diagnosed ? 'Yes' : 'No'}
MRI Status: ${injury?.mri_status || 'N/A'}
Injection Status: ${injury?.injections_status || 'N/A'}
Surgery Status: ${injury?.surgery_status || 'N/A'}
MMI Reached: ${injury?.mmi_reached ? 'Yes' : 'No'}
Notes: ${injury?.additional_notes || 'N/A'}

SETTLEMENT:
Gross Settlement Target: ${settlement?.gross_settlement ? '$' + settlement.gross_settlement.toLocaleString() : 'N/A'}
Attorney Fee: ${settlement?.attorney_fee_percentage ? settlement.attorney_fee_percentage + '%' : 'N/A'}
Net to Client: ${settlement?.net_to_client ? '$' + settlement.net_to_client.toLocaleString() : 'N/A'}

ATTORNEY OF RECORD:
${attorney ? `${attorney.user_name || 'N/A'}` : 'Not assigned'}`

  const sharedInstructions = `
INSTRUCTIONS:
- Follow the template structure exactly - same sections, same order, same legal language
- Replace placeholders with case data above
- For the adjuster salutation use "Dear Mr./Ms. [Last Name]," - infer gender from name if possible, otherwise use full name
- For the demand amount: if gross settlement target is set use that dollar figure, otherwise demand policy limits
- For injuries/diagnoses/treatment: use the injury status data to write realistic, specific clinical language consistent with a PI demand letter
- For the Medical Expenses section: if provider and billing information is included in the injury notes, extract and list each provider with their billed amount. If no itemized data is available, state the total amount only.
- Do not invent facts not supported by the case data
- Output only the letter - no preamble, no commentary`

  if (demandType === 'stowers') {
    return `You are a legal demand letter writer for The Lopez Law Group. Generate a formal demand letter that exactly follows the structure, tone, and legal language of the template below. Replace all bracketed placeholders with the case data provided. Do not add sections that are not in the template. Do not remove any sections. Keep all legal language exactly as written.

---
TEMPLATE STRUCTURE TO FOLLOW:

[TODAY'S DATE]

Via Fax: [ADJUSTER FAX]

[INSURANCE CARRIER NAME]
Attn: [ADJUSTER NAME]
[CARRIER ADDRESS]

Re: Demand for Settlement - [INCIDENT TYPE]
Claim Number: [CLAIM NUMBER]
Date of Incident: [DATE OF LOSS]

Client: [CLIENT NAME]

Insured: [DEFENDANT / INSURED NAME]

Policy Number: [POLICY NUMBER]

Dear [ADJUSTER SALUTATION],

This letter is a formal demand for settlement under your insured's liability coverage provisions. [CLIENT NAME] was involved in a [INCIDENT TYPE] on [DATE OF LOSS], due to the negligent actions of your insured, who failed to exercise proper care. As a result of this collision, [CLIENT NAME] sustained significant injuries and has undergone extensive medical treatment totaling [TOTAL MEDICAL BILLS IF KNOWN, otherwise omit amount].

Accident Overview

[NARRATIVE OF THE ACCIDENT - use the narrative and liability notes from case data. Write 2-3 clear, assertive paragraphs describing how the accident occurred, the client's role, conditions, and the defendant's fault.]

Injuries Sustained

[CLIENT NAME] presented for medical evaluation following the incident. Symptoms included:

[LIST KEY SYMPTOMS AND COMPLAINTS based on injury status data - cervical pain, lumbar pain, headaches, etc.]

Medical Diagnoses

Following diagnostic imaging and medical evaluations, [CLIENT NAME] received the following diagnoses:

[LIST DIAGNOSES with ICD codes if available - base on MRI status, TBI, injury notes]

Treatment Plan

[CLIENT NAME]'s medical care has included:

[LIST TREATMENTS - base on injection status, surgery status, MRI, ER visit, treatment notes. Include frequency and recommended future treatment if applicable.]

Medical Expenses

[CLIENT NAME] has incurred the following reasonable, necessary, and causally related medical expenses:

[LIST EACH PROVIDER WITH AMOUNT - extract from the injury notes field which contains provider details, or list any provider data available. Format each as: "- Provider Name - $Amount". End with a total line: "Total Medical Expenses: $[TOTAL]"]

All charges are customary, reasonable, and medically necessary.

Stower's Doctrine and Demand of Settlement

Under your policy, you have a duty to (1) defend the insured against any claim within the scope of coverage and (2) indemnify the insured for any damages awarded against your insured. These two duties give rise to the Stower's doctrine or your duty to accept reasonable settlement offers within policy limits. Through this duty, you may be liable for negligently refusing to settle this claim within policy limits.

Under the Stower's doctrine my client's demand of settlement must propose to fully release the insured in exchange for either a stated sum of money or the "policy limits". The Stower's doctrine also requires my client to offer in the demand of settlement a full and unconditional release of all potential claims including all liens and an amount to settle within policy limits.

We hereby extend on behalf of our client [CLIENT NAME] our demand of settlement for the [DEMAND AMOUNT - use gross settlement target if available, otherwise "limits of your insured's policy"], in exchange for a full and unconditional release of all potential claims against your insured, including all liens.

We kindly request that you respond to this letter within 30 days from the date of receipt. We hope to achieve a prompt and fair resolution to this matter and avoid the necessity of legal action. However, if we do not receive a satisfactory response within the stipulated time frame, we will have no choice but to pursue legal remedies.

Please feel free to contact me to discuss this matter further or to provide any additional information you may require. We look forward to your prompt attention to this matter.

Respectfully,

The Lopez Law Group

[ATTORNEY NAME]
Attorney at Law
${caseDataSection}
${sharedInstructions}`
  }

  const formalTemplate = `You are a legal demand letter writer for The Lopez Law Group. Generate a formal demand letter that exactly follows the structure, tone, and legal language of the template below. Replace all bracketed placeholders with the case data provided. Do not add sections that are not in the template. Do not remove any sections. Keep all legal language exactly as written.

---
TEMPLATE STRUCTURE TO FOLLOW:

[TODAY'S DATE]

Via Fax: [ADJUSTER FAX]

[INSURANCE CARRIER NAME]
Attn: [ADJUSTER NAME]

Re: [INCIDENT TYPE] - Personal Injury Claim
Claim Number: [CLAIM NUMBER]
Date of Incident: [DATE OF LOSS]

Client: [CLIENT NAME]
Insured: [DEFENDANT / INSURED NAME]

Dear [ADJUSTER SALUTATION],

Our office represents [CLIENT NAME] for injuries sustained in a motor vehicle collision on [DATE OF LOSS]. This correspondence serves as a formal demand for settlement.

LIABILITY

[Write 1-2 assertive paragraphs establishing clear liability on the part of your insured. Reference the accident description, road conditions, and how the defendant's negligence directly caused the collision.]

INJURIES AND MEDICAL TREATMENT

[CLIENT NAME] presented for medical evaluation following the incident. Objective findings included:

[LIST KEY SYMPTOMS AND COMPLAINTS as bullet points - cervical pain, lumbar pain, headaches, radiculopathy, etc.]

[CLIENT NAME] continues to experience the following ongoing symptoms:

[LIST ONGOING SYMPTOMS as bullet points - base on treatment notes, MMI status, surgery/injection status]

MEDICAL EXPENSES

[CLIENT NAME] has incurred the following reasonable, necessary, and causally related medical expenses:

[LIST EACH PROVIDER WITH AMOUNT - Format each as: "- Provider Name - $Amount". End with "Total Medical Expenses: $[TOTAL]"]

All charges are customary, reasonable, and medically necessary.

DAMAGES

[CLIENT NAME] has suffered significant pain and suffering, mental anguish, and loss of enjoyment of life as a direct result of the negligence of your insured. [Write 1-2 paragraphs highlighting the most serious injuries and their impact on the client's daily life, work, and relationships.]

DEMAND FOR SETTLEMENT

We hereby demand $[GROSS_SETTLEMENT_OR_POLICY_LIMITS - use gross settlement target if available, otherwise "the applicable policy limits"] or the applicable policy limits, whichever is less, in full and final settlement of all claims arising out of this incident, in exchange for a full and unconditional release of all potential claims, including all liens.

Stowers Demand

Please be advised that this constitutes a Stowers demand. You are hereby required to respond within 15 days of receipt of this letter. Failure to accept this demand within policy limits may expose your insured to an excess judgment, for which you may be held liable under the Stowers doctrine.

Respectfully,

The Lopez Law Group

[ATTORNEY NAME]
Attorney at Law
${caseDataSection}
${sharedInstructions}`

  if (demandType === 'formal') return formalTemplate

  // 'simple' - same as formal without the Stowers Demand section, 30-day deadline
  return `You are a legal demand letter writer for The Lopez Law Group. Generate a formal demand letter that exactly follows the structure, tone, and legal language of the template below. Replace all bracketed placeholders with the case data provided. Do not add sections that are not in the template. Do not remove any sections. Keep all legal language exactly as written.

---
TEMPLATE STRUCTURE TO FOLLOW:

[TODAY'S DATE]

Via Fax: [ADJUSTER FAX]

[INSURANCE CARRIER NAME]
Attn: [ADJUSTER NAME]

Re: [INCIDENT TYPE] - Personal Injury Claim
Claim Number: [CLAIM NUMBER]
Date of Incident: [DATE OF LOSS]

Client: [CLIENT NAME]
Insured: [DEFENDANT / INSURED NAME]

Dear [ADJUSTER SALUTATION],

Our office represents [CLIENT NAME] for injuries sustained in a motor vehicle collision on [DATE OF LOSS]. This correspondence serves as a formal demand for settlement.

LIABILITY

[Write 1-2 assertive paragraphs establishing clear liability on the part of your insured. Reference the accident description, road conditions, and how the defendant's negligence directly caused the collision.]

INJURIES AND MEDICAL TREATMENT

[CLIENT NAME] presented for medical evaluation following the incident. Objective findings included:

[LIST KEY SYMPTOMS AND COMPLAINTS as bullet points - cervical pain, lumbar pain, headaches, radiculopathy, etc.]

[CLIENT NAME] continues to experience the following ongoing symptoms:

[LIST ONGOING SYMPTOMS as bullet points - base on treatment notes, MMI status, surgery/injection status]

MEDICAL EXPENSES

[CLIENT NAME] has incurred the following reasonable, necessary, and causally related medical expenses:

[LIST EACH PROVIDER WITH AMOUNT - Format each as: "- Provider Name - $Amount". End with "Total Medical Expenses: $[TOTAL]"]

All charges are customary, reasonable, and medically necessary.

DAMAGES

[CLIENT NAME] has suffered significant pain and suffering, mental anguish, and loss of enjoyment of life as a direct result of the negligence of your insured. [Write 1-2 paragraphs highlighting the most serious injuries and their impact on the client's daily life, work, and relationships.]

DEMAND FOR SETTLEMENT

We hereby demand $[GROSS_SETTLEMENT_OR_POLICY_LIMITS - use gross settlement target if available, otherwise "the applicable policy limits"] or the applicable policy limits, whichever is less, in full and final settlement of all claims arising out of this incident, in exchange for a full and unconditional release of all potential claims, including all liens.

We kindly request that you respond to this letter within 30 days from the date of receipt. We hope to achieve a prompt and fair resolution to this matter and avoid the necessity of legal action.

Respectfully,

The Lopez Law Group

[ATTORNEY NAME]
Attorney at Law
${caseDataSection}
${sharedInstructions}`
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DemandLetterTab({ caseId }: Props) {
  console.log('[DemandLetterTab] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 20))
  console.log('[DemandLetterTab] Anon key present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const supabase = useMemo(() => createClient(), [])

  const [demandType, setDemandType] = useState<'stowers' | 'formal' | 'simple'>('stowers')
  const [letter, setLetter] = useState<DemandLetter | null>(null)
  const [editContent, setEditContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('demand_letters')
        .select('*')
        .eq('case_id', caseId)
        .maybeSingle()

      if (data) {
        setLetter(data)
        setSavedContent(data.content ?? '')
        setEditContent(data.content ?? '')
      }
      setLoading(false)
    }
    load()
  }, [caseId, supabase])

  const isDirty = editContent !== savedContent
  const hasLetter = !!letter?.content
  const canEdit = !generating && !saving && !isEditing

  async function handleGenerate() {
    console.log('[DemandLetterTab] generateLetter called')
    setGenerating(true)
    setGenerateError(null)
    setIsEditing(false)

    const [caseRes, defendantsRes, injuryRes, settlementRes, workersRes] = await Promise.all([
      supabase
        .from('cases')
        .select('client_name, phone, email, accident_date, accident_location, client_role, conditions, accident_description, at_fault_insurer, at_fault_adjuster_name, at_fault_adjuster_phone, at_fault_adjuster_email, at_fault_claim_number, at_fault_policy_limits')
        .eq('id', caseId)
        .single(),
      supabase.from('defendants').select('*').eq('case_id', caseId),
      supabase.from('injury_status').select('*').eq('case_id', caseId).maybeSingle(),
      supabase.from('settlement_worksheets').select('*').eq('case_id', caseId).maybeSingle(),
      supabase.from('case_workers').select('*').eq('case_id', caseId),
    ])

    const prompt = buildPrompt({
      caseData: caseRes.data,
      defendants: defendantsRes.data ?? [],
      injury: injuryRes.data,
      settlement: settlementRes.data,
      workers: workersRes.data ?? [],
      demandType,
    })

    let generatedContent: string
    try {
      console.log('[DemandLetterTab] Fetching:', '/api/demand-letter/generate')
      const res = await fetch('/api/demand-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const fullText = data.content
      generatedContent = fullText
    } catch (err) {
      console.error('[DemandLetterTab] Caught error:', err)
      setGenerateError('Network error. Please try again.')
      setGenerating(false)
      return
    }

    const now = new Date().toISOString()
    const nextVersion = (letter?.version ?? 0) + 1

    const payload = {
      case_id: caseId,
      content: generatedContent,
      version: nextVersion,
      model: 'claude-sonnet-4-20250514',
      generated_at: now,
      last_saved_at: now,
      updated_at: now,
      ...(letter?.id ? { id: letter.id } : {}),
    }

    console.log('[DemandLetterTab] Saving to Supabase')
    const { data, error } = await supabase
      .from('demand_letters')
      .upsert(payload, { onConflict: 'case_id' })
      .select()
      .single()

    if (error || !data) {
      setGenerateError(error?.message ?? 'Failed to save generated letter.')
      setGenerating(false)
      return
    }

    setLetter(data)
    setSavedContent(generatedContent)
    setEditContent(generatedContent)
    setLastSavedAt(new Date())
    setGenerating(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const now = new Date().toISOString()

    const payload = {
      case_id: caseId,
      content: editContent,
      version: letter?.version ?? 1,
      last_saved_at: now,
      updated_at: now,
      ...(letter?.id ? { id: letter.id } : {}),
    }

    const { data, error } = await supabase
      .from('demand_letters')
      .upsert(payload, { onConflict: 'case_id' })
      .select()
      .single()

    if (error || !data) {
      setSaveError(error?.message ?? 'Failed to save.')
      setSaving(false)
      return
    }

    setLetter(data)
    setSavedContent(editContent)
    setLastSavedAt(new Date())
    setIsEditing(false)
    setSaving(false)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/demand-letter/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: savedContent, caseId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error ?? 'Export failed. Please try again.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `demand-letter-${caseId}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  async function exportPDF() {
    setIsExporting(true)
    try {
      const res = await fetch('/api/demand-letter/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: savedContent,
          letterheadUrl: 'https://xgsegmcapbrteiaiizah.supabase.co/storage/v1/object/public/assets/letterhead.png',
          footerUrl: 'https://xgsegmcapbrteiaiizah.supabase.co/storage/v1/object/public/assets/footer.png',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error ?? 'PDF export failed. Please try again.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `demand-letter-${caseId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('PDF export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  function handleStartEdit() {
    setSaveError(null)
    setEditContent(savedContent)
    setIsEditing(true)
  }

  function handleCancelEdit() {
    setEditContent(savedContent)
    setIsEditing(false)
    setSaveError(null)
  }

  if (loading) return <p className="text-sm text-[#6b6b6b]">Loading demand letter...</p>

  return (
    <div className="space-y-5">

      {/* ── Page header ───────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-[#2b2b2b]">Demand Letter</h2>
        <p className="text-sm text-[#6b6b6b]">Changes are not auto-saved.</p>
      </div>

      {/* ── Demand type selector ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-[#6b6b6b]">Demand Type</label>
        <select
          value={demandType}
          onChange={(e) => setDemandType(e.target.value as 'stowers' | 'formal' | 'simple')}
          disabled={generating || saving}
          className="rounded-md border border-[#d9d9d9] bg-white px-3 py-1.5 text-sm text-[#2b2b2b] outline-none focus:border-[#1d4f91] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="stowers">Stowers Demand (Policy Limits)</option>
          <option value="formal">Formal Demand (Specific Amount)</option>
          <option value="simple">Simple Demand</option>
        </select>
      </div>

      {/* ── Generate button ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || saving || isEditing}
          className="flex items-center gap-2 rounded-md bg-[#5b3fd4] px-4 py-2 text-sm font-medium text-white hover:bg-[#4e35b8] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {generating ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating...
            </>
          ) : (
            <>
              <SparkleIcon className="h-3.5 w-3.5" />
              {hasLetter ? 'Regenerate Letter' : 'Generate Letter'}
            </>
          )}
        </button>

        {hasLetter && !isEditing && (
          <span className="text-xs text-[#9b9b9b]">
            Version {letter.version}
            {letter.generated_at ? ` · Generated ${formatDate(letter.generated_at)}` : ''}
          </span>
        )}
      </div>

      {/* ── Generate error ────────────────────────────────────────────────────── */}
      {generateError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {generateError}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────────── */}
      {!hasLetter && !generating && (
        <div className="rounded-xl border-2 border-dashed border-[#e5e5e5] bg-white px-8 py-16 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f0ff]">
            <SparkleIcon className="h-5 w-5 text-[#5b3fd4]" />
          </div>
          <p className="text-sm font-medium text-[#6b6b6b]">No demand letter yet</p>
          <p className="mt-1 text-xs text-[#b9b9b9]">
            Click &ldquo;Generate Letter&rdquo; to draft one using the case data on file.
          </p>
        </div>
      )}

      {/* ── Generating skeleton ───────────────────────────────────────────────── */}
      {generating && (
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9b9b9b]">
              Demand Letter
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative flex items-center justify-center">
              <span className="h-10 w-10 animate-spin rounded-full border-2 border-[#e5e5e5] border-t-[#5b3fd4]" />
              <SparkleIcon className="absolute h-4 w-4 text-[#5b3fd4] animate-pulse" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium text-[#2b2b2b]">Drafting your demand letter</p>
              <p className="text-xs text-[#9b9b9b]">This usually takes 15-30 seconds</p>
            </div>
            <div className="w-64 space-y-2 pt-2">
              <div className="h-2 w-full animate-pulse rounded-full bg-[#f0f0f0]" />
              <div className="h-2 w-5/6 animate-pulse rounded-full bg-[#f0f0f0]" />
              <div className="h-2 w-4/6 animate-pulse rounded-full bg-[#f0f0f0]" />
            </div>
          </div>
        </div>
      )}

      {/* ── Letter card ───────────────────────────────────────────────────────── */}
      {hasLetter && !generating && (
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
          {/* Section header */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9b9b9b]">
              Demand Letter
            </h3>
            <div className="flex items-center gap-3">
              {isEditing && isDirty && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Unsaved changes
                </span>
              )}
              {!isEditing && (
                <>
                  <button
                    type="button"
                    onClick={exportPDF}
                    disabled={isExporting || generating || saving}
                    className="rounded-md border border-[#d9d9d9] bg-white px-3 py-1 text-xs font-medium text-[#555555] hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isExporting ? 'Exporting...' : 'Export PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    disabled={!canEdit}
                    className="rounded-md border border-[#d9d9d9] bg-white px-3 py-1 text-xs font-medium text-[#555555] hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Read mode */}
          {!isEditing && (
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-[#2b2b2b]">
              {savedContent}
            </pre>
          )}

          {/* Edit mode */}
          {isEditing && (
            <>
              <textarea
                rows={44}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full resize-y rounded-md border border-[#e5e5e5] bg-[#fafafa] px-3 py-2 font-mono text-sm leading-relaxed text-[#2b2b2b] outline-none focus:border-[#1d4f91] focus:bg-white"
              />
              <div className="mt-5 border-t border-[#f3f3f3] pt-4">
                {saveError && <p className="mb-3 text-sm text-red-600">{saveError}</p>}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-md bg-[#1d4f91] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4580] disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
                  >
                    Cancel
                  </button>
                  {lastSavedAt && (
                    <span className="text-xs text-[#9b9b9b]">
                      Last saved: {formatTime(lastSavedAt)}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Generation metadata card ──────────────────────────────────────────── */}
      {hasLetter && !generating && (
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#9b9b9b]">
            Generation Details
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <div>
              <p className="mb-0.5 text-xs font-medium text-[#6b6b6b]">Version</p>
              <p className="text-sm text-[#2b2b2b]">{letter.version}</p>
            </div>
            <div>
              <p className="mb-0.5 text-xs font-medium text-[#6b6b6b]">Model</p>
              <p className="text-sm text-[#2b2b2b]">{letter.model}</p>
            </div>
            <div>
              <p className="mb-0.5 text-xs font-medium text-[#6b6b6b]">Generated</p>
              <p className="text-sm text-[#2b2b2b]">
                {letter.generated_at ? formatDate(letter.generated_at) : '--'}
              </p>
            </div>
            <div>
              <p className="mb-0.5 text-xs font-medium text-[#6b6b6b]">Last Saved</p>
              <p className="text-sm text-[#2b2b2b]">
                {letter.last_saved_at ? formatDate(letter.last_saved_at) : '--'}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
