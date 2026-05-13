'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CaseProviderRow } from '@/app/(dashboard)/cases/[caseId]/overview/page'

type CaseData = {
  id: string
  caseNumber: string
  clientName: string
  phone: string
  email: string
  preferredLanguage: string
  caseStatus: string
  caseType: string
  accidentDate: string
  accidentLocation: string
  accidentDescription: string
  createdAt: string
  lastStatusChange: string
  assignedTo: string
  sourceChannel: string
  screeningScore: number | null
  estimatedCaseValue: number | null
  liabilityAssessment: string
  injurySeverity: string
  aiCaseTypeConfidence: number | null
  aiSummary: string
  redFlags: string[]
}

type DefendantRow = {
  id: string
  defendant_name: string | null
  insurance_carrier: string | null
  adjuster_name: string | null
  adjuster_phone: string | null
  adjuster_email: string | null
  claim_number: string | null
  policy_limits: number | null
  bi_limits: number | null
}

type Props = {
  caseData: CaseData
  defendants: DefendantRow[]
  caseProviders: CaseProviderRow[]
}

const CASE_TYPE_LABELS: Record<string, string> = {
  motor_vehicle_accident: 'Motor Vehicle Accident',
  mva: 'Motor Vehicle Accident',
  truck_accident: 'Truck Accident',
  slip_fall: 'Slip & Fall',
  premises_liability: 'Premises Liability',
  personal_injury: 'Personal Injury',
  wrongful_death: 'Wrongful Death',
  unknown: 'Unknown',
}

const PHASE_STYLES: Record<string, string> = {
  intake:      'bg-[#dbeafe] text-[#1d4f91]',
  treatment:   'bg-[#fef9c3] text-[#854d0e]',
  demand:      'bg-[#ffedd5] text-[#9a3412]',
  negotiation: 'bg-[#f3e8ff] text-[#6b21a8]',
  settlement:  'bg-[#dcfce7] text-[#1f7a4d]',
  litigation:  'bg-[#fee2e2] text-[#b91c1c]',
  closed:      'bg-[#f3f4f6] text-[#6b6b6b]',
  archived:    'bg-[#f3f4f6] text-[#9b9b9b]',
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

function formatDate(value: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatUSD(value: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function daysOpen(createdAt: string): number {
  if (!createdAt) return 0
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
}

function getProviderInfo(providers: CaseProviderRow['providers']) {
  if (!providers) return null
  return Array.isArray(providers) ? providers[0] ?? null : providers
}

function getFinancial(fins: CaseProviderRow['case_provider_financials']) {
  if (!fins || fins.length === 0) return null
  return fins[0]
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9b9b9b]">
      {children}
    </p>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9b9b9b]">{label}</span>
      <span className="text-sm text-[#2b2b2b]">{value || '—'}</span>
    </div>
  )
}

export default function CaseOverview({ caseData, defendants, caseProviders }: Props) {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showAI, setShowAI] = useState(false)

  const days = daysOpen(caseData.createdAt)
  const phaseStyle = PHASE_STYLES[caseData.caseStatus] ?? PHASE_STYLES.closed
  const caseTypeLabel = CASE_TYPE_LABELS[caseData.caseType] ?? caseData.caseType?.replace(/_/g, ' ') ?? '—'

  const descLower = caseData.accidentDescription.toLowerCase()
  const liabilityConfirmed =
    descLower.includes('accepted liability') ||
    descLower.includes('100% liability') ||
    descLower.includes('admitted fault') ||
    descLower.includes('admitted liability')

  const totalBilled = caseProviders.reduce((sum, p) => sum + (getFinancial(p.case_provider_financials)?.original_bill ?? 0), 0)
  const totalOwed   = caseProviders.reduce((sum, p) => sum + (getFinancial(p.case_provider_financials)?.still_owed   ?? 0), 0)

  return (
    <div className="space-y-4">

      {/* ── SECTION 1: Header bar ─────────────────────────────────── */}
      <div className="rounded-xl border border-[#e5e5e5] bg-[#f9f9f9] px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#2b2b2b]">{caseData.clientName}</h1>
            <p className="mt-0.5 text-sm text-[#9b9b9b]">{caseData.caseNumber || 'No case number'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {caseTypeLabel && (
              <span className="rounded-md border border-[#e5e5e5] bg-white px-3 py-1 text-xs font-medium text-[#444444]">
                {caseTypeLabel}
              </span>
            )}
            <span className={`rounded-md px-3 py-1 text-xs font-semibold capitalize ${phaseStyle}`}>
              {caseData.caseStatus}
            </span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#9b9b9b]">
          <span><span className="font-semibold text-[#6b6b6b]">{days}</span> days open</span>
          {caseData.lastStatusChange && (
            <span>Last status change: <span className="font-semibold text-[#6b6b6b]">{formatDate(caseData.lastStatusChange)}</span></span>
          )}
          {caseData.assignedTo && (
            <span>Assigned to: <span className="font-semibold text-[#6b6b6b]">{caseData.assignedTo}</span></span>
          )}
        </div>
      </div>

      {/* ── SECTION 2: Three-column grid ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* LEFT — Client Info */}
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
          <SectionLabel>Client Info</SectionLabel>
          <div className="space-y-3">
            <Field label="Full Name" value={caseData.clientName} />
            <Field
              label="Phone"
              value={caseData.phone
                ? <a href={`tel:${caseData.phone}`} className="text-[#1d4f91] hover:underline">{formatPhone(caseData.phone)}</a>
                : null}
            />
            <Field
              label="Email"
              value={caseData.email
                ? <a href={`mailto:${caseData.email}`} className="text-[#1d4f91] hover:underline">{caseData.email}</a>
                : null}
            />
            <Field label="Language" value={caseData.preferredLanguage === 'es' ? 'Español' : 'English'} />
            <Field label="Assigned To" value={caseData.assignedTo || 'Unassigned'} />
            <Field label="Source" value={caseData.sourceChannel || '—'} />
          </div>
          <div className="mt-5 flex gap-2">
            <Link
              href={`/cases/${caseData.id}/sms`}
              className="flex-1 rounded-md bg-[#1d4f91] px-3 py-2 text-center text-xs font-medium text-white hover:bg-[#1a4580]"
            >
              Send SMS
            </Link>
            <Link
              href={`/cases/${caseData.id}/notes`}
              className="flex-1 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-center text-xs font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
            >
              Add Note
            </Link>
          </div>
        </div>

        {/* MIDDLE — Incident Summary */}
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
          <SectionLabel>Incident Summary</SectionLabel>
          <div className="space-y-3">
            <Field label="Date of Incident" value={formatDate(caseData.accidentDate)} />
            <Field label="Incident Type" value={caseTypeLabel} />
            <Field label="Location" value={caseData.accidentLocation} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9b9b9b]">Liability Status</span>
              {liabilityConfirmed ? (
                <span className="inline-flex w-fit rounded-md bg-[#dcfce7] px-2 py-0.5 text-xs font-semibold text-[#1f7a4d]">
                  Liability Confirmed
                </span>
              ) : (
                <span className="inline-flex w-fit rounded-md bg-[#f3f4f6] px-2 py-0.5 text-xs font-semibold text-[#6b6b6b]">
                  Pending
                </span>
              )}
            </div>
          </div>

          {caseData.accidentDescription && (
            <div className="mt-4">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9b9b9b]">Description</span>
              <p className={`mt-1.5 text-sm leading-relaxed text-[#444444] ${!showFullDescription ? 'line-clamp-3' : ''}`}>
                {caseData.accidentDescription}
              </p>
              {caseData.accidentDescription.length > 180 && (
                <button
                  type="button"
                  onClick={() => setShowFullDescription(v => !v)}
                  className="mt-1 text-xs font-medium text-[#1d4f91] hover:underline"
                >
                  {showFullDescription ? 'Show Less' : 'Show More'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Defendants / Insurance */}
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
          <SectionLabel>Defendants / Insurance</SectionLabel>
          {defendants.length === 0 ? (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-[#9b9b9b]">No defendants on file.</p>
              <Link
                href={`/cases/${caseData.id}/defendants`}
                className="text-xs font-medium text-[#1d4f91] hover:underline"
              >
                Add defendant →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {defendants.map((d) => (
                <div key={d.id} className="rounded-lg border border-[#f0f0f0] bg-[#fafafa] p-3 text-sm">
                  <p className="font-semibold text-[#2b2b2b]">{d.insurance_carrier || 'Unknown Carrier'}</p>
                  {d.defendant_name && <p className="text-xs text-[#6b6b6b]">{d.defendant_name}</p>}
                  <div className="mt-2 space-y-1 text-xs text-[#444444]">
                    {d.adjuster_name && (
                      <p>
                        <span className="font-medium">Adjuster:</span> {d.adjuster_name}
                        {d.adjuster_phone && (
                          <> · <a href={`tel:${d.adjuster_phone}`} className="text-[#1d4f91] hover:underline">{formatPhone(d.adjuster_phone)}</a></>
                        )}
                      </p>
                    )}
                    {d.claim_number && <p><span className="font-medium">Claim #:</span> {d.claim_number}</p>}
                    {(d.policy_limits || d.bi_limits) && (
                      <p>
                        <span className="font-medium">Limits:</span>{' '}
                        {d.policy_limits ? `Policy ${formatUSD(d.policy_limits)}` : ''}
                        {d.policy_limits && d.bi_limits ? ' · ' : ''}
                        {d.bi_limits ? `BI ${formatUSD(d.bi_limits)}` : ''}
                      </p>
                    )}
                    {d.adjuster_email && (
                      <p>
                        <a href={`mailto:${d.adjuster_email}`} className="text-[#1d4f91] hover:underline">{d.adjuster_email}</a>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 3: Medical Summary ────────────────────────────── */}
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionLabel>Medical Providers</SectionLabel>
          {caseProviders.length > 0 && (
            <div className="mb-3 flex gap-4 text-sm">
              <span className="text-[#6b6b6b]">
                Total Billed: <span className="font-semibold text-[#2b2b2b]">{formatUSD(totalBilled)}</span>
              </span>
              <span className="text-[#6b6b6b]">
                Still Owed: <span className="font-semibold text-[#b91c1c]">{formatUSD(totalOwed)}</span>
              </span>
            </div>
          )}
        </div>

        {caseProviders.length === 0 ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-[#9b9b9b]">No medical providers on file.</p>
            <Link
              href={`/cases/${caseData.id}/medical-treatment`}
              className="text-xs font-medium text-[#1d4f91] hover:underline"
            >
              Add provider →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#f0f0f0]">
                  {['Provider', 'Type', 'Treatment', 'First Visit', 'Last Visit', 'Original Bill', 'Still Owed', 'Records', 'Billing'].map(h => (
                    <th key={h} className="whitespace-nowrap pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-[#9b9b9b]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {caseProviders.map((p) => {
                  const prov = getProviderInfo(p.providers)
                  const fin  = getFinancial(p.case_provider_financials)
                  return (
                    <tr key={p.id} className="border-b border-[#f9f9f9]">
                      <td className="py-2.5 pr-4 font-medium text-[#2b2b2b]">{prov?.name ?? '—'}</td>
                      <td className="py-2.5 pr-4 text-[#6b6b6b]">{prov?.provider_type ?? '—'}</td>
                      <td className="max-w-[160px] truncate py-2.5 pr-4 text-[#444444]">{p.treatment_description ?? '—'}</td>
                      <td className="whitespace-nowrap py-2.5 pr-4 text-[#6b6b6b]">{p.first_visit_date ? formatDate(p.first_visit_date) : '—'}</td>
                      <td className="whitespace-nowrap py-2.5 pr-4 text-[#6b6b6b]">{p.last_visit_date  ? formatDate(p.last_visit_date)  : '—'}</td>
                      <td className="whitespace-nowrap py-2.5 pr-4 text-[#2b2b2b]">{formatUSD(fin?.original_bill ?? null)}</td>
                      <td className="whitespace-nowrap py-2.5 pr-4 font-medium text-[#b91c1c]">{formatUSD(fin?.still_owed ?? null)}</td>
                      <td className="py-2.5 pr-4 text-[#6b6b6b]">{p.records_status ?? '—'}</td>
                      <td className="py-2.5 pr-4 text-[#6b6b6b]">{p.billing_status  ?? '—'}</td>
                    </tr>
                  )
                })}
                <tr className="border-t-2 border-[#e5e5e5] bg-[#fafafa] font-semibold">
                  <td colSpan={5} className="py-2.5 pr-4 text-xs uppercase tracking-wide text-[#9b9b9b]">Totals</td>
                  <td className="py-2.5 pr-4 text-[#2b2b2b]">{formatUSD(totalBilled)}</td>
                  <td className="py-2.5 pr-4 text-[#b91c1c]">{formatUSD(totalOwed)}</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SECTION 4: AI Intake Summary (collapsed) ──────────────── */}
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
        <button
          type="button"
          onClick={() => setShowAI(v => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-[#9b9b9b]">
            AI Intake Details
          </span>
          <svg
            className={`h-4 w-4 text-[#9b9b9b] transition-transform ${showAI ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAI && (
          <div className="mt-4 space-y-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <Field label="Screening Score" value={caseData.screeningScore != null ? `${caseData.screeningScore}/100` : '—'} />
              <Field label="Est. Case Value" value={formatUSD(caseData.estimatedCaseValue)} />
              <Field label="Liability Assessment" value={caseData.liabilityAssessment} />
              <Field label="Injury Severity" value={caseData.injurySeverity} />
              <Field label="Case Type Confidence" value={caseData.aiCaseTypeConfidence != null ? String(caseData.aiCaseTypeConfidence) : '—'} />
            </div>

            {caseData.aiSummary && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9b9b9b]">AI Summary</span>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-[#444444]">{caseData.aiSummary}</p>
              </div>
            )}

            {caseData.redFlags.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9b9b9b]">Red Flags</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {caseData.redFlags.map((flag) => (
                    <span key={flag} className="rounded-full border border-[#e5e5e5] bg-[#fcfcfc] px-3 py-1 text-xs text-[#444444]">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
