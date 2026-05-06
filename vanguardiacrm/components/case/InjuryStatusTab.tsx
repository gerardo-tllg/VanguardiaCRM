'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { InjuryStatus, MRIStatus, InjectionStatus, SurgeryStatus } from '@/types/case'

type Props = { caseId: string }

type EditSection = 'general' | 'diagnostic' | 'treatment' | 'mmi' | 'notes' | null

type InjuryForm = {
  injury_description: string
  er_visit: boolean
  er_visit_date: string
  treating_physicians: string
  mri_status: MRIStatus
  mri_notes: string
  tbi_diagnosed: boolean
  tbi_notes: string
  injections_status: InjectionStatus
  injections_notes: string
  surgery_status: SurgeryStatus
  surgery_notes: string
  current_treatment_status: string
  mmi_reached: boolean
  mmi_date: string
  additional_notes: string
}

const DEFAULT_FORM: InjuryForm = {
  injury_description: '',
  er_visit: false,
  er_visit_date: '',
  treating_physicians: '',
  mri_status: 'none',
  mri_notes: '',
  tbi_diagnosed: false,
  tbi_notes: '',
  injections_status: 'none',
  injections_notes: '',
  surgery_status: 'none',
  surgery_notes: '',
  current_treatment_status: '',
  mmi_reached: false,
  mmi_date: '',
  additional_notes: '',
}

function dbToForm(r: InjuryStatus): InjuryForm {
  return {
    injury_description: r.injury_description ?? '',
    er_visit: r.er_visit,
    er_visit_date: r.er_visit_date ?? '',
    treating_physicians: r.treating_physicians ?? '',
    mri_status: r.mri_status,
    mri_notes: r.mri_notes ?? '',
    tbi_diagnosed: r.tbi_diagnosed,
    tbi_notes: r.tbi_notes ?? '',
    injections_status: r.injections_status,
    injections_notes: r.injections_notes ?? '',
    surgery_status: r.surgery_status,
    surgery_notes: r.surgery_notes ?? '',
    current_treatment_status: r.current_treatment_status ?? '',
    mmi_reached: r.mmi_reached,
    mmi_date: r.mmi_date ?? '',
    additional_notes: r.additional_notes ?? '',
  }
}

function getStatusColors(value: string) {
  switch (value) {
    case 'completed':    return { bg: 'bg-[#ecf8f1]', text: 'text-[#1f7a4d]', border: 'border-[#b9e4cf]' }
    case 'scheduled':   return { bg: 'bg-[#eef4ff]', text: 'text-[#1d4f91]', border: 'border-[#c9daf7]' }
    case 'ordered':
    case 'recommended': return { bg: 'bg-[#fff8e8]', text: 'text-[#8a5a00]', border: 'border-[#f1d9a6]' }
    default:            return { bg: 'bg-[#f5f5f5]', text: 'text-[#6b6b6b]', border: 'border-[#e5e5e5]' }
  }
}

const MRI_OPTIONS: { value: MRIStatus; label: string }[] = [
  { value: 'none',      label: 'None'      },
  { value: 'ordered',   label: 'Ordered'   },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
]
const INJECTION_OPTIONS: { value: InjectionStatus; label: string }[] = [
  { value: 'none',        label: 'None'        },
  { value: 'recommended', label: 'Recommended' },
  { value: 'scheduled',   label: 'Scheduled'   },
  { value: 'completed',   label: 'Completed'   },
]
const SURGERY_OPTIONS: { value: SurgeryStatus; label: string }[] = [
  { value: 'none',        label: 'None'        },
  { value: 'recommended', label: 'Recommended' },
  { value: 'scheduled',   label: 'Scheduled'   },
  { value: 'completed',   label: 'Completed'   },
]

function getLabel<T extends string>(options: { value: T; label: string }[], value: T): string {
  return options.find((o) => o.value === value)?.label ?? value
}

function formatDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

// ── Read mode primitives ──────────────────────────────────────────────────────

function ReadField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-medium text-[#6b6b6b]">{label}</p>
      <p className="text-sm text-[#2b2b2b]">{value || '—'}</p>
    </div>
  )
}

function ReadNotes({ value }: { value: string }) {
  if (!value) return <p className="text-sm italic text-[#b9b9b9]">No notes added</p>
  return (
    <p className="rounded-md bg-[#f9f9f9] px-3 py-2 text-sm leading-relaxed text-[#2b2b2b] whitespace-pre-wrap">
      {value}
    </p>
  )
}

function BoolBadge({ label, value }: { label: string; value: boolean }) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-medium text-[#6b6b6b]">{label}</p>
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        value ? 'bg-[#ecf8f1] text-[#1f7a4d]' : 'bg-[#f5f5f5] text-[#6b6b6b]'
      }`}>
        {value ? 'Yes' : 'No'}
      </span>
    </div>
  )
}

function ReadStatusBadge({ label, value, displayLabel }: { label: string; value: string; displayLabel: string }) {
  const c = getStatusColors(value)
  return (
    <div>
      <p className="mb-0.5 text-xs font-medium text-[#6b6b6b]">{label}</p>
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text} ${c.border}`}>
        {displayLabel}
      </span>
    </div>
  )
}

// ── Edit mode primitives ──────────────────────────────────────────────────────

function Toggle({ checked, onChange, label, id }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; id: string
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-[#1d4f91]' : 'bg-[#d9d9d9]'
        }`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
      <label htmlFor={id} className="cursor-pointer select-none text-sm font-medium text-[#2b2b2b]">{label}</label>
    </div>
  )
}

function StatusSelect<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void
}) {
  const c = getStatusColors(value)
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#6b6b6b]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={`w-full rounded-md border px-3 py-2 text-sm font-medium outline-none ${c.bg} ${c.text} ${c.border}`}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function EditTextArea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div>
      {label && <label className="mb-1.5 block text-xs font-medium text-[#6b6b6b]">{label}</label>}
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-md border border-[#e5e5e5] px-3 py-2 text-sm text-[#2b2b2b] outline-none focus:border-[#1d4f91]"
      />
    </div>
  )
}

function EditTextField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#6b6b6b]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-[#e5e5e5] px-3 py-2 text-sm text-[#2b2b2b] outline-none focus:border-[#1d4f91]"
      />
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, isEditing, onEdit, canEdit, children }: {
  title: string
  isEditing: boolean
  onEdit: () => void
  canEdit: boolean
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9b9b9b]">{title}</h3>
        {!isEditing && (
          <button
            type="button"
            onClick={onEdit}
            disabled={!canEdit}
            className="rounded-md border border-[#d9d9d9] bg-white px-3 py-1 text-xs font-medium text-[#555555] hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Edit
          </button>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function EditActions({ onSave, onCancel, saving, error }: {
  onSave: () => void; onCancel: () => void; saving: boolean; error: string | null
}) {
  return (
    <div className="mt-5 border-t border-[#f3f3f3] pt-4">
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-md bg-[#1d4f91] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4580] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InjuryStatusTab({ caseId }: Props) {
  const supabase = useMemo(() => createClient(), [])

  const [form, setForm] = useState<InjuryForm>(DEFAULT_FORM)
  const [savedForm, setSavedForm] = useState<InjuryForm>(DEFAULT_FORM)
  const [existingId, setExistingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<EditSection>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('injury_status')
        .select('*')
        .eq('case_id', caseId)
        .maybeSingle()

      if (data) {
        setExistingId(data.id)
        const f = dbToForm(data)
        setForm(f)
        setSavedForm(f)
      }
      setLoading(false)
    }
    load()
  }, [caseId, supabase])

  function startEdit(section: EditSection) {
    setSaveError(null)
    setEditingSection(section)
  }

  function cancelEdit() {
    setForm(savedForm)
    setEditingSection(null)
    setSaveError(null)
  }

  function set<K extends keyof InjuryForm>(key: K) {
    return (val: InjuryForm[K]) => setForm((prev) => ({ ...prev, [key]: val }))
  }
  function setText(key: keyof InjuryForm) {
    return (val: string) => setForm((prev) => ({ ...prev, [key]: val }))
  }

  async function saveSection() {
    setSaving(true)
    setSaveError(null)

    const payload = {
      case_id: caseId,
      injury_description: form.injury_description || null,
      er_visit: form.er_visit,
      er_visit_date: form.er_visit && form.er_visit_date ? form.er_visit_date : null,
      treating_physicians: form.treating_physicians || null,
      mri_status: form.mri_status,
      mri_notes: form.mri_notes || null,
      tbi_diagnosed: form.tbi_diagnosed,
      tbi_notes: form.tbi_diagnosed ? (form.tbi_notes || null) : null,
      injections_status: form.injections_status,
      injections_notes: form.injections_notes || null,
      surgery_status: form.surgery_status,
      surgery_notes: form.surgery_notes || null,
      current_treatment_status: form.current_treatment_status || null,
      mmi_reached: form.mmi_reached,
      mmi_date: form.mmi_reached && form.mmi_date ? form.mmi_date : null,
      additional_notes: form.additional_notes || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('injury_status')
      .upsert(
        { ...payload, ...(existingId ? { id: existingId } : {}) },
        { onConflict: 'case_id' }
      )
      .select()
      .single()

    if (error || !data) {
      setSaveError(error?.message ?? 'Failed to save')
      setSaving(false)
      return
    }

    setExistingId(data.id)
    setSavedForm(form)
    setEditingSection(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-[#6b6b6b]">Loading injury status...</p>

  const canEdit = editingSection === null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#2b2b2b]">Injury Status</h2>
          <p className="text-sm text-[#6b6b6b]">Changes are not auto-saved</p>
        </div>
        {saved && <span className="text-sm font-medium text-[#1f7a4d]">Saved</span>}
      </div>

      {/* Section 1 — General */}
      <Section title="General" isEditing={editingSection === 'general'} onEdit={() => startEdit('general')} canEdit={canEdit}>
        {editingSection === 'general' ? (
          <>
            <EditTextArea
              label="Injury Description"
              value={form.injury_description}
              onChange={setText('injury_description')}
              placeholder="Describe the injuries sustained..."
              rows={3}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <Toggle id="er_visit" checked={form.er_visit} onChange={set('er_visit')} label="ER Visit" />
                {form.er_visit && (
                  <EditTextField label="ER Visit Date" type="date" value={form.er_visit_date} onChange={setText('er_visit_date')} />
                )}
              </div>
              <EditTextField
                label="Treating Physicians"
                value={form.treating_physicians}
                onChange={setText('treating_physicians')}
                placeholder="e.g. Dr. Smith, Dr. Reyes"
              />
            </div>
            <EditActions onSave={saveSection} onCancel={cancelEdit} saving={saving} error={saveError} />
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="mb-0.5 text-xs font-medium text-[#6b6b6b]">Injury Description</p>
              {form.injury_description
                ? <p className="text-sm text-[#2b2b2b] whitespace-pre-wrap">{form.injury_description}</p>
                : <p className="text-sm text-[#2b2b2b]">—</p>}
            </div>
            <BoolBadge label="ER Visit" value={form.er_visit} />
            <ReadField
              label="ER Visit Date"
              value={form.er_visit ? formatDisplayDate(form.er_visit_date) : '—'}
            />
            <ReadField label="Treating Physicians" value={form.treating_physicians} />
          </div>
        )}
      </Section>

      {/* Section 2 — Diagnostic */}
      <Section title="Diagnostic" isEditing={editingSection === 'diagnostic'} onEdit={() => startEdit('diagnostic')} canEdit={canEdit}>
        {editingSection === 'diagnostic' ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <StatusSelect label="MRI Status" value={form.mri_status} options={MRI_OPTIONS} onChange={set('mri_status')} />
                {form.mri_status !== 'none' && (
                  <EditTextArea label="MRI Notes" value={form.mri_notes} onChange={setText('mri_notes')} rows={2} />
                )}
              </div>
              <div className="space-y-3">
                <Toggle id="tbi_diagnosed" checked={form.tbi_diagnosed} onChange={set('tbi_diagnosed')} label="TBI Diagnosed" />
                {form.tbi_diagnosed && (
                  <EditTextArea label="TBI Notes" value={form.tbi_notes} onChange={setText('tbi_notes')} rows={2} />
                )}
              </div>
            </div>
            <EditActions onSave={saveSection} onCancel={cancelEdit} saving={saving} error={saveError} />
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <ReadStatusBadge
                label="MRI Status"
                value={form.mri_status}
                displayLabel={getLabel(MRI_OPTIONS, form.mri_status)}
              />
              {form.mri_status !== 'none' && (
                <div>
                  <p className="mb-0.5 text-xs font-medium text-[#6b6b6b]">MRI Notes</p>
                  <ReadNotes value={form.mri_notes} />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <BoolBadge label="TBI Diagnosed" value={form.tbi_diagnosed} />
              {form.tbi_diagnosed && (
                <div>
                  <p className="mb-0.5 text-xs font-medium text-[#6b6b6b]">TBI Notes</p>
                  <ReadNotes value={form.tbi_notes} />
                </div>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* Section 3 — Treatment */}
      <Section title="Treatment" isEditing={editingSection === 'treatment'} onEdit={() => startEdit('treatment')} canEdit={canEdit}>
        {editingSection === 'treatment' ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <StatusSelect label="Injections Status" value={form.injections_status} options={INJECTION_OPTIONS} onChange={set('injections_status')} />
                {form.injections_status !== 'none' && (
                  <EditTextArea label="Injections Notes" value={form.injections_notes} onChange={setText('injections_notes')} rows={2} />
                )}
              </div>
              <div className="space-y-3">
                <StatusSelect label="Surgery Status" value={form.surgery_status} options={SURGERY_OPTIONS} onChange={set('surgery_status')} />
                {form.surgery_status !== 'none' && (
                  <EditTextArea label="Surgery Notes" value={form.surgery_notes} onChange={setText('surgery_notes')} rows={2} />
                )}
              </div>
            </div>
            <EditTextField
              label="Current Treatment Status"
              value={form.current_treatment_status}
              onChange={setText('current_treatment_status')}
              placeholder="e.g. Active chiropractic care, 2x per week"
            />
            <EditActions onSave={saveSection} onCancel={cancelEdit} saving={saving} error={saveError} />
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <ReadStatusBadge
                label="Injections Status"
                value={form.injections_status}
                displayLabel={getLabel(INJECTION_OPTIONS, form.injections_status)}
              />
              {form.injections_status !== 'none' && (
                <div>
                  <p className="mb-0.5 text-xs font-medium text-[#6b6b6b]">Injections Notes</p>
                  <ReadNotes value={form.injections_notes} />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <ReadStatusBadge
                label="Surgery Status"
                value={form.surgery_status}
                displayLabel={getLabel(SURGERY_OPTIONS, form.surgery_status)}
              />
              {form.surgery_status !== 'none' && (
                <div>
                  <p className="mb-0.5 text-xs font-medium text-[#6b6b6b]">Surgery Notes</p>
                  <ReadNotes value={form.surgery_notes} />
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <ReadField label="Current Treatment Status" value={form.current_treatment_status} />
            </div>
          </div>
        )}
      </Section>

      {/* Section 4 — MMI */}
      <Section title="Maximum Medical Improvement" isEditing={editingSection === 'mmi'} onEdit={() => startEdit('mmi')} canEdit={canEdit}>
        {editingSection === 'mmi' ? (
          <>
            <div className="flex flex-wrap items-start gap-6">
              <Toggle id="mmi_reached" checked={form.mmi_reached} onChange={set('mmi_reached')} label="MMI Reached" />
              {form.mmi_reached && (
                <div className="w-48">
                  <EditTextField label="MMI Date" type="date" value={form.mmi_date} onChange={setText('mmi_date')} />
                </div>
              )}
            </div>
            <EditActions onSave={saveSection} onCancel={cancelEdit} saving={saving} error={saveError} />
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <BoolBadge label="MMI Reached" value={form.mmi_reached} />
            <ReadField
              label="MMI Date"
              value={form.mmi_reached ? formatDisplayDate(form.mmi_date) : '—'}
            />
          </div>
        )}
      </Section>

      {/* Section 5 — Additional Notes */}
      <Section title="Additional Notes" isEditing={editingSection === 'notes'} onEdit={() => startEdit('notes')} canEdit={canEdit}>
        {editingSection === 'notes' ? (
          <>
            <EditTextArea
              label=""
              value={form.additional_notes}
              onChange={setText('additional_notes')}
              placeholder="Any additional notes about the client's injury or treatment..."
              rows={4}
            />
            <EditActions onSave={saveSection} onCancel={cancelEdit} saving={saving} error={saveError} />
          </>
        ) : (
          <ReadNotes value={form.additional_notes} />
        )}
      </Section>
    </div>
  )
}
