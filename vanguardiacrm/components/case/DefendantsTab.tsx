'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Defendant } from '@/types/case'

type Props = {
  caseId: string
}

type DefendantForm = Omit<Defendant, 'id' | 'case_id' | 'created_at' | 'updated_at'>

const EMPTY_FORM: DefendantForm = {
  defendant_name: null,
  defendant_address: null,
  insurance_carrier: null,
  adjuster_name: null,
  adjuster_phone: null,
  adjuster_email: null,
  claim_number: null,
  policy_limits: null,
  bi_limits: null,
  um_uim_limits: null,
  med_pay_limits: null,
  property_damage_limits: null,
  notes: null,
}

function formatUSD(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function parseCurrency(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, '')
  if (cleaned === '') return null
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? null : parsed
}

type FieldConfig = {
  key: keyof DefendantForm
  label: string
  type: 'text' | 'email' | 'tel' | 'currency' | 'textarea'
}

const FIELDS: FieldConfig[] = [
  { key: 'defendant_name', label: 'Defendant Name', type: 'text' },
  { key: 'defendant_address', label: 'Address', type: 'text' },
  { key: 'insurance_carrier', label: 'Insurance Carrier', type: 'text' },
  { key: 'claim_number', label: 'Claim Number', type: 'text' },
  { key: 'adjuster_name', label: 'Adjuster Name', type: 'text' },
  { key: 'adjuster_phone', label: 'Adjuster Phone', type: 'tel' },
  { key: 'adjuster_email', label: 'Adjuster Email', type: 'email' },
  { key: 'policy_limits', label: 'Policy Limits', type: 'currency' },
  { key: 'bi_limits', label: 'BI Limits', type: 'currency' },
  { key: 'um_uim_limits', label: 'UM/UIM Limits', type: 'currency' },
  { key: 'med_pay_limits', label: 'Med Pay Limits', type: 'currency' },
  { key: 'property_damage_limits', label: 'Property Damage Limits', type: 'currency' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
]

const CURRENCY_KEYS = new Set<keyof DefendantForm>([
  'policy_limits', 'bi_limits', 'um_uim_limits', 'med_pay_limits', 'property_damage_limits',
])

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-[#9b9b9b]">{label}</p>
      <p className="text-sm font-medium text-[#2b2b2b]">{value ?? '—'}</p>
    </div>
  )
}

function DefendantFormFields({
  form,
  onChange,
}: {
  form: DefendantForm
  onChange: (key: keyof DefendantForm, value: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {FIELDS.map(({ key, label, type }) => {
        const raw = form[key]
        const value = raw === null || raw === undefined ? '' : String(raw)

        if (type === 'textarea') {
          return (
            <div key={key} className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-[#6b6b6b]">{label}</label>
              <textarea
                rows={3}
                value={value}
                onChange={(e) => onChange(key, e.target.value)}
                className="w-full rounded-md border border-[#e5e5e5] px-3 py-2 text-sm text-[#2b2b2b] outline-none focus:border-[#1d4f91] resize-none"
              />
            </div>
          )
        }

        return (
          <div key={key}>
            <label className="mb-1 block text-xs font-medium text-[#6b6b6b]">{label}</label>
            <input
              type={type === 'currency' ? 'text' : type}
              value={value}
              placeholder={type === 'currency' ? '$0' : ''}
              onChange={(e) => onChange(key, e.target.value)}
              className="w-full rounded-md border border-[#e5e5e5] px-3 py-2 text-sm text-[#2b2b2b] outline-none focus:border-[#1d4f91]"
            />
          </div>
        )
      })}
    </div>
  )
}

function DefendantCard({
  defendant,
  onSave,
  onDelete,
}: {
  defendant: Defendant
  onSave: (id: string, form: DefendantForm) => Promise<string | null>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<DefendantForm>(() => {
    const { id, case_id, created_at, updated_at, ...rest } = defendant
    return rest
  })
  const [savedForm, setSavedForm] = useState<DefendantForm>(form)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(key: keyof DefendantForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: CURRENCY_KEYS.has(key) ? parseCurrency(value) : (value === '' ? null : value),
    }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const err = await onSave(defendant.id, form)
    setSaving(false)
    if (err) {
      setError(err)
    } else {
      setSavedForm(form)
      setEditing(false)
    }
  }

  function handleCancel() {
    setForm(savedForm)
    setEditing(false)
    setError(null)
  }

  async function handleDelete() {
    setDeleting(true)
    await onDelete(defendant.id)
    setDeleting(false)
  }

  const displayName = defendant.defendant_name || 'Unnamed Defendant'

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
      {!editing ? (
        <>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-[#2b2b2b]">{displayName}</h3>
              {defendant.insurance_carrier && (
                <p className="mt-0.5 text-sm text-[#6b6b6b]">{defendant.insurance_carrier}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-md border border-[#d9d9d9] bg-white px-3 py-1.5 text-xs font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
              >
                Edit
              </button>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-md border border-[#f5c6c6] bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-[#fff5f5]"
                >
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#6b6b6b]">Confirm?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Yes, delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-md border border-[#d9d9d9] bg-white px-3 py-1.5 text-xs font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
            <InfoRow label="Address" value={defendant.defendant_address} />
            <InfoRow label="Adjuster" value={defendant.adjuster_name} />
            <InfoRow label="Adjuster Phone" value={defendant.adjuster_phone} />
            <InfoRow label="Adjuster Email" value={defendant.adjuster_email} />
            <InfoRow label="Claim #" value={defendant.claim_number} />
            <InfoRow label="Policy Limits" value={formatUSD(defendant.policy_limits)} />
            <InfoRow label="BI Limits" value={formatUSD(defendant.bi_limits)} />
            <InfoRow label="UM/UIM" value={formatUSD(defendant.um_uim_limits)} />
            <InfoRow label="Med Pay" value={formatUSD(defendant.med_pay_limits)} />
            <InfoRow label="Prop. Damage" value={formatUSD(defendant.property_damage_limits)} />
          </div>

          <div className="mt-4">
            <p className="text-xs text-[#9b9b9b]">Notes</p>
            {defendant.notes ? (
              <p className="mt-1 rounded-md bg-[#f9f9f9] px-3 py-2 text-sm text-[#2b2b2b]">
                {defendant.notes}
              </p>
            ) : (
              <p className="mt-1 rounded-md bg-[#f9f9f9] px-3 py-2 text-sm italic text-[#9b9b9b]">
                No notes added
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <h3 className="mb-4 text-sm font-semibold text-[#2b2b2b]">Edit Defendant</h3>
          <DefendantFormFields form={form} onChange={handleChange} />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-[#1d4f91] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4580] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function DefendantsTab({ caseId }: Props) {
  const supabase = useMemo(() => createClient(), [])

  const [defendants, setDefendants] = useState<Defendant[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<DefendantForm>(EMPTY_FORM)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDefendants() {
      setLoading(true)
      const { data, error } = await supabase
        .from('defendants')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true })

      if (error) {
        setFetchError(error.message)
      } else {
        setDefendants(data ?? [])
      }
      setLoading(false)
    }

    fetchDefendants()
  }, [caseId, supabase])

  function handleAddChange(key: keyof DefendantForm, value: string) {
    setAddForm((prev) => ({
      ...prev,
      [key]: CURRENCY_KEYS.has(key) ? parseCurrency(value) : (value === '' ? null : value),
    }))
  }

  async function handleAdd() {
    setAdding(true)
    setAddError(null)

    const { data, error } = await supabase
      .from('defendants')
      .insert({ ...addForm, case_id: caseId })
      .select()
      .single()

    if (error || !data) {
      setAddError(error?.message ?? 'Failed to add defendant')
      setAdding(false)
      return
    }

    setDefendants((prev) => [...prev, data])
    setAddForm(EMPTY_FORM)
    setShowAddForm(false)
    setAdding(false)
  }

  async function handleSave(id: string, form: DefendantForm): Promise<string | null> {
    const { data, error } = await supabase
      .from('defendants')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      return error?.message ?? 'Failed to save'
    }

    setDefendants((prev) => prev.map((d) => (d.id === id ? data : d)))
    return null
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('defendants').delete().eq('id', id)
    if (!error) {
      setDefendants((prev) => prev.filter((d) => d.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#2b2b2b]">Defendants</h2>
          <p className="text-sm text-[#6b6b6b]">
            {defendants.length === 0 ? 'No defendants on record' : `${defendants.length} defendant${defendants.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAddForm((prev) => !prev)
            setAddError(null)
          }}
          className="rounded-md bg-[#1d4f91] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4580]"
        >
          {showAddForm ? 'Cancel' : '+ Add Defendant'}
        </button>
      </div>

      {showAddForm && (
        <div className="rounded-xl border border-[#c9daf7] bg-[#f5f8ff] p-5">
          <h3 className="mb-4 text-sm font-semibold text-[#1d4f91]">New Defendant</h3>
          <DefendantFormFields form={addForm} onChange={handleAddChange} />
          {addError && <p className="mt-3 text-sm text-red-600">{addError}</p>}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="rounded-md bg-[#1d4f91] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4580] disabled:opacity-50"
            >
              {adding ? 'Saving...' : 'Save Defendant'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setAddForm(EMPTY_FORM)
                setAddError(null)
              }}
              className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && (
        <p className="text-sm text-[#6b6b6b]">Loading defendants...</p>
      )}

      {fetchError && (
        <p className="text-sm text-red-600">{fetchError}</p>
      )}

      {!loading && defendants.length === 0 && !showAddForm && (
        <div className="rounded-xl border border-dashed border-[#d9d9d9] bg-white px-6 py-10 text-center">
          <p className="text-sm text-[#9b9b9b]">No defendants added yet.</p>
          <p className="mt-1 text-xs text-[#b9b9b9]">Click &quot;+ Add Defendant&quot; to get started.</p>
        </div>
      )}

      {defendants.map((defendant) => (
        <DefendantCard
          key={defendant.id}
          defendant={defendant}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
