'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SettlementWorksheet } from '@/types/case'

type Props = { caseId: string }

type WorksheetForm = {
  gross_settlement: string
  attorney_fee_percentage: string
  litigation_costs: string
  case_costs: string
  advances_issued: string
  medical_bills_total: string
  attorney_liens: string
  health_insurance_subrogation: string
  med_pay_recovery: string
  notes: string
}

const DEFAULT_FORM: WorksheetForm = {
  gross_settlement: '',
  attorney_fee_percentage: '33.33',
  litigation_costs: '',
  case_costs: '',
  advances_issued: '',
  medical_bills_total: '',
  attorney_liens: '',
  health_insurance_subrogation: '',
  med_pay_recovery: '',
  notes: '',
}

function toNum(val: string): number {
  const n = parseFloat(val.replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}

function usd(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val)
}

function dbToForm(ws: SettlementWorksheet): WorksheetForm {
  return {
    gross_settlement:           ws.gross_settlement === 0           ? '' : String(ws.gross_settlement),
    attorney_fee_percentage:    String(ws.attorney_fee_percentage),
    litigation_costs:           ws.litigation_costs === 0           ? '' : String(ws.litigation_costs),
    case_costs:                 ws.case_costs === 0                 ? '' : String(ws.case_costs),
    advances_issued:            ws.advances_issued === 0            ? '' : String(ws.advances_issued),
    medical_bills_total:        ws.medical_bills_total === 0        ? '' : String(ws.medical_bills_total),
    attorney_liens:             ws.attorney_liens === 0             ? '' : String(ws.attorney_liens),
    health_insurance_subrogation: ws.health_insurance_subrogation === 0 ? '' : String(ws.health_insurance_subrogation),
    med_pay_recovery:           ws.med_pay_recovery === 0           ? '' : String(ws.med_pay_recovery),
    notes:                      ws.notes ?? '',
  }
}

// ── Shared read/edit row primitives ──────────────────────────────────────────

function ReadNotes({ value }: { value: string }) {
  if (!value) return <p className="text-sm italic text-[#b9b9b9]">No notes added</p>
  return (
    <p className="rounded-md bg-[#f9f9f9] px-3 py-2 text-sm leading-relaxed text-[#2b2b2b] whitespace-pre-wrap">
      {value}
    </p>
  )
}

function ReadRow({ num, label, sublabel, amount, isDeduction = true }: {
  num?: number; label: string; sublabel?: string; amount: number; isDeduction?: boolean
}) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="w-16 shrink-0 text-right">
        {num !== undefined && (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#eef4ff] text-xs font-semibold text-[#1d4f91]">
            {num}
          </span>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[#2b2b2b]">{label}</p>
        {sublabel && <p className="text-xs text-[#9b9b9b]">{sublabel}</p>}
      </div>
      <p className="w-40 text-right text-sm text-[#2b2b2b]">
        {amount === 0 ? <span className="text-[#b9b9b9]">—</span> : usd(amount)}
      </p>
      <div className="w-4 shrink-0 text-center text-[#9b9b9b]">
        {isDeduction ? '−' : ''}
      </div>
    </div>
  )
}

function EditRow({ num, label, sublabel, value, onChange }: {
  num?: number; label: string; sublabel?: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="w-16 shrink-0 text-right">
        {num !== undefined && (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#eef4ff] text-xs font-semibold text-[#1d4f91]">
            {num}
          </span>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[#2b2b2b]">{label}</p>
        {sublabel && <p className="text-xs text-[#9b9b9b]">{sublabel}</p>}
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9b9b9b]">$</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          className="w-40 rounded-md border border-[#e5e5e5] py-2 pl-7 pr-3 text-right text-sm text-[#2b2b2b] outline-none focus:border-[#1d4f91]"
        />
      </div>
      <div className="w-4 shrink-0 text-center text-[#9b9b9b]">−</div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SettlementWorksheetTab({ caseId }: Props) {
  const supabase = useMemo(() => createClient(), [])

  const [form, setForm] = useState<WorksheetForm>(DEFAULT_FORM)
  const [savedForm, setSavedForm] = useState<WorksheetForm>(DEFAULT_FORM)
  const [existingId, setExistingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function fetchWorksheet() {
      const { data } = await supabase
        .from('settlement_worksheets')
        .select('*')
        .eq('case_id', caseId)
        .maybeSingle()

      if (data) {
        setExistingId(data.id)
        const f = dbToForm(data)
        setForm(f)
        setSavedForm(f)
        setEditing(false)
      } else {
        setEditing(true)
      }
      setLoading(false)
    }
    fetchWorksheet()
  }, [caseId, supabase])

  function set(key: keyof WorksheetForm) {
    return (val: string) => setForm((prev) => ({ ...prev, [key]: val }))
  }

  function cancelEdit() {
    setForm(savedForm)
    setEditing(false)
    setSaveError(null)
  }

  const gross       = toNum(form.gross_settlement)
  const feePercent  = toNum(form.attorney_fee_percentage)
  const feeAmount   = gross * feePercent / 100
  const litigation  = toNum(form.litigation_costs)
  const caseCosts   = toNum(form.case_costs)
  const advances    = toNum(form.advances_issued)
  const medBills    = toNum(form.medical_bills_total)
  const liens       = toNum(form.attorney_liens)
  const subrogation = toNum(form.health_insurance_subrogation)
  const medPay      = toNum(form.med_pay_recovery)
  const totalDeductions = feeAmount + litigation + caseCosts + advances + medBills + liens + subrogation + medPay
  const netToClient = gross - totalDeductions
  const isNegative  = netToClient < 0

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    setSaved(false)

    const payload = {
      case_id: caseId,
      gross_settlement: gross,
      attorney_fee_percentage: feePercent,
      litigation_costs: litigation,
      case_costs: caseCosts,
      advances_issued: advances,
      medical_bills_total: medBills,
      attorney_liens: liens,
      health_insurance_subrogation: subrogation,
      med_pay_recovery: medPay,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('settlement_worksheets')
      .upsert({ ...payload, ...(existingId ? { id: existingId } : {}) }, { onConflict: 'case_id' })
      .select()
      .single()

    if (error || !data) {
      setSaveError(error?.message ?? 'Failed to save worksheet')
      setSaving(false)
      return
    }

    setExistingId(data.id)
    setSavedForm(form)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-[#6b6b6b]">Loading worksheet...</p>

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#2b2b2b]">Settlement Worksheet</h2>
          <p className="text-sm text-[#6b6b6b]">
            {editing ? 'Live calculation — save when ready' : 'Last saved figures'}
          </p>
        </div>
        {saved && <span className="text-sm font-medium text-[#1f7a4d]">Saved</span>}
      </div>

      {/* Worksheet card */}
      <div className="rounded-xl border border-[#e5e5e5] bg-white">
        {/* Card header */}
        <div className="flex items-center gap-4 border-b border-[#e5e5e5] px-6 py-3">
          <div className="w-16 shrink-0" />
          <p className="flex-1 text-xs font-semibold uppercase tracking-wide text-[#9b9b9b]">Line Item</p>
          <p className="w-40 text-right text-xs font-semibold uppercase tracking-wide text-[#9b9b9b]">Amount</p>
          <div className="flex w-4 shrink-0 justify-end">
            {!editing && (
              <button
                type="button"
                onClick={() => { setSaveError(null); setEditing(true) }}
                className="rounded-md border border-[#d9d9d9] bg-white px-3 py-1 text-xs font-medium text-[#555555] hover:bg-[#f7f7f7]"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-[#f3f3f3] px-6">
          {/* Tier 1 — Gross Settlement */}
          <div className="flex items-center gap-4 py-3">
            <div className="w-16 shrink-0 text-right">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#eef4ff] text-xs font-semibold text-[#1d4f91]">1</span>
            </div>
            <p className="flex-1 text-sm font-medium text-[#2b2b2b]">Gross Settlement</p>
            {editing ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9b9b9b]">$</span>
                <input
                  type="text"
                  value={form.gross_settlement}
                  onChange={(e) => set('gross_settlement')(e.target.value)}
                  placeholder="0.00"
                  className="w-40 rounded-md border border-[#e5e5e5] py-2 pl-7 pr-3 text-right text-sm font-semibold text-[#2b2b2b] outline-none focus:border-[#1d4f91]"
                />
              </div>
            ) : (
              <p className="w-40 text-right text-sm font-semibold text-[#2b2b2b]">
                {gross === 0 ? <span className="text-[#b9b9b9]">—</span> : usd(gross)}
              </p>
            )}
            <div className="w-4 shrink-0" />
          </div>

          {/* Tier 2 — Attorney Fee */}
          <div className="flex items-center gap-4 py-3">
            <div className="w-16 shrink-0 text-right">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#eef4ff] text-xs font-semibold text-[#1d4f91]">2</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#2b2b2b]">Attorney Fee</p>
              {editing ? (
                <div className="mt-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={form.attorney_fee_percentage}
                    onChange={(e) => set('attorney_fee_percentage')(e.target.value)}
                    className="w-16 rounded-md border border-[#e5e5e5] px-2 py-1 text-right text-xs text-[#2b2b2b] outline-none focus:border-[#1d4f91]"
                  />
                  <span className="text-xs text-[#9b9b9b]">% = {usd(feeAmount)}</span>
                </div>
              ) : (
                <p className="text-xs text-[#9b9b9b]">{feePercent}% of gross</p>
              )}
            </div>
            {editing ? (
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9b9b9b]">$</span>
                <input
                  type="text"
                  value={feeAmount === 0 ? '' : feeAmount.toFixed(2)}
                  readOnly
                  tabIndex={-1}
                  className="w-40 cursor-default rounded-md border border-[#e5e5e5] bg-[#f9f9f9] py-2 pl-7 pr-3 text-right text-sm text-[#6b6b6b] outline-none"
                />
              </div>
            ) : (
              <p className="w-40 text-right text-sm text-[#2b2b2b]">
                {feeAmount === 0 ? <span className="text-[#b9b9b9]">—</span> : usd(feeAmount)}
              </p>
            )}
            <div className="w-4 shrink-0 text-center text-[#9b9b9b]">−</div>
          </div>

          {/* Tiers 3–7 */}
          {editing ? (
            <>
              <EditRow num={3} label="Litigation Costs"    value={form.litigation_costs}  onChange={set('litigation_costs')} />
              <EditRow num={4} label="Case Costs"          value={form.case_costs}         onChange={set('case_costs')} />
              <EditRow num={5} label="Advances Issued"     value={form.advances_issued}    onChange={set('advances_issued')} />
              <EditRow num={6} label="Medical Bills Total" value={form.medical_bills_total} onChange={set('medical_bills_total')} />
              <EditRow num={7} label="Attorney Liens"      value={form.attorney_liens}     onChange={set('attorney_liens')} />
            </>
          ) : (
            <>
              <ReadRow num={3} label="Litigation Costs"    amount={litigation} />
              <ReadRow num={4} label="Case Costs"          amount={caseCosts} />
              <ReadRow num={5} label="Advances Issued"     amount={advances} />
              <ReadRow num={6} label="Medical Bills Total" amount={medBills} />
              <ReadRow num={7} label="Attorney Liens"      amount={liens} />
            </>
          )}

          {/* Tier 8 — Subrogation + Med Pay */}
          <div className="flex items-center gap-4 py-3">
            <div className="w-16 shrink-0 text-right">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#eef4ff] text-xs font-semibold text-[#1d4f91]">8</span>
            </div>
            <div className="flex-1 space-y-2">
              {/* Health Insurance Subrogation */}
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-[#2b2b2b]">Health Insurance Subrogation</p>
                {editing ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9b9b9b]">$</span>
                    <input type="text" value={form.health_insurance_subrogation} onChange={(e) => set('health_insurance_subrogation')(e.target.value)} placeholder="0.00" className="w-40 rounded-md border border-[#e5e5e5] py-2 pl-7 pr-3 text-right text-sm text-[#2b2b2b] outline-none focus:border-[#1d4f91]" />
                  </div>
                ) : (
                  <p className="w-40 text-right text-sm text-[#2b2b2b]">
                    {subrogation === 0 ? <span className="text-[#b9b9b9]">—</span> : usd(subrogation)}
                  </p>
                )}
              </div>
              {/* Med Pay Recovery */}
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-[#2b2b2b]">Med Pay Recovery</p>
                {editing ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9b9b9b]">$</span>
                    <input type="text" value={form.med_pay_recovery} onChange={(e) => set('med_pay_recovery')(e.target.value)} placeholder="0.00" className="w-40 rounded-md border border-[#e5e5e5] py-2 pl-7 pr-3 text-right text-sm text-[#2b2b2b] outline-none focus:border-[#1d4f91]" />
                  </div>
                ) : (
                  <p className="w-40 text-right text-sm text-[#2b2b2b]">
                    {medPay === 0 ? <span className="text-[#b9b9b9]">—</span> : usd(medPay)}
                  </p>
                )}
              </div>
            </div>
            <div className="w-4 shrink-0 text-center text-[#9b9b9b]">−</div>
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-[#e5e5e5] px-6">
          <div className="flex items-center gap-4 py-3">
            <div className="w-16 shrink-0" />
            <p className="flex-1 text-sm font-medium text-[#6b6b6b]">Total Deductions</p>
            <p className="w-40 text-right text-sm font-medium text-[#6b6b6b]">{usd(totalDeductions)}</p>
            <div className="w-4 shrink-0" />
          </div>

          <div className={`mb-4 flex items-center gap-4 rounded-lg px-4 py-4 ${isNegative ? 'bg-[#fff5f5]' : 'bg-[#ecf8f1]'}`}>
            <div className="w-16 shrink-0" />
            <div className="flex-1">
              <p className={`text-base font-semibold ${isNegative ? 'text-red-700' : 'text-[#1f7a4d]'}`}>Net to Client</p>
              {isNegative && (
                <p className="mt-0.5 text-xs font-medium text-red-600">Warning: Deductions exceed gross settlement</p>
              )}
            </div>
            <p className={`w-40 text-right text-xl font-bold ${isNegative ? 'text-red-700' : 'text-[#1f7a4d]'}`}>
              {usd(netToClient)}
            </p>
            <div className="w-4 shrink-0" />
          </div>
        </div>

        {/* Edit mode save/cancel */}
        {editing && (
          <div className="border-t border-[#e5e5e5] px-6 py-4">
            {saveError && <p className="mb-3 text-sm text-red-600">{saveError}</p>}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-[#1d4f91] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4580] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Worksheet'}
              </button>
              {existingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#2b2b2b]">Notes</p>
          {!editing && (
            <button
              type="button"
              onClick={() => { setSaveError(null); setEditing(true) }}
              className="rounded-md border border-[#d9d9d9] bg-white px-3 py-1 text-xs font-medium text-[#555555] hover:bg-[#f7f7f7]"
            >
              Edit
            </button>
          )}
        </div>
        {editing ? (
          <textarea
            rows={4}
            value={form.notes}
            onChange={(e) => set('notes')(e.target.value)}
            placeholder="Add settlement notes, negotiation history, special conditions..."
            className="w-full resize-none rounded-md border border-[#e5e5e5] px-3 py-2 text-sm text-[#2b2b2b] outline-none focus:border-[#1d4f91]"
          />
        ) : (
          <ReadNotes value={form.notes} />
        )}
      </div>
    </div>
  )
}
