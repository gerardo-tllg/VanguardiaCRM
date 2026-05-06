'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CaseWorker, CaseWorkerRole } from '@/types/case'

type Props = {
  caseId: string
}

type WorkerForm = {
  user_name: string
  user_email: string
  user_phone: string
  notes: string
}

const EMPTY_FORM: WorkerForm = {
  user_name: '',
  user_email: '',
  user_phone: '',
  notes: '',
}

type RoleConfig = {
  key: CaseWorkerRole
  label: string
}

const ROLES: RoleConfig[] = [
  { key: 'attorney_of_record',  label: 'Attorney of Record'  },
  { key: 'paralegal',           label: 'Paralegal'           },
  { key: 'case_manager',        label: 'Case Manager'        },
  { key: 'intake_specialist',   label: 'Intake Specialist'   },
  { key: 'medical_coordinator', label: 'Medical Coordinator' },
  { key: 'negotiator',          label: 'Negotiator'          },
  { key: 'litigation_attorney', label: 'Litigation Attorney' },
  { key: 'legal_assistant',     label: 'Legal Assistant'     },
  { key: 'receptionist',        label: 'Receptionist'        },
  { key: 'lien_negotiator',     label: 'Lien Negotiator'     },
  { key: 'referring_contact',   label: 'Referring Contact'   },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

type WorkerCardProps = {
  role: RoleConfig
  worker: CaseWorker | null
  onSave: (role: CaseWorkerRole, form: WorkerForm) => Promise<string | null>
  onRemove: (id: string, role: CaseWorkerRole) => Promise<void>
}

function WorkerCard({ role, worker, onSave, onRemove }: WorkerCardProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<WorkerForm>(
    worker
      ? {
          user_name: worker.user_name ?? '',
          user_email: worker.user_email ?? '',
          user_phone: worker.user_phone ?? '',
          notes: worker.notes ?? '',
        }
      : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof WorkerForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const err = await onSave(role.key, form)
    setSaving(false)
    if (err) {
      setError(err)
    } else {
      setEditing(false)
    }
  }

  function handleCancelEdit() {
    setForm(
      worker
        ? {
            user_name: worker.user_name ?? '',
            user_email: worker.user_email ?? '',
            user_phone: worker.user_phone ?? '',
            notes: worker.notes ?? '',
          }
        : EMPTY_FORM
    )
    setEditing(false)
    setError(null)
  }

  async function handleRemove() {
    if (!worker) return
    setRemoving(true)
    await onRemove(worker.id, role.key)
    setRemoving(false)
    setConfirmRemove(false)
    setForm(EMPTY_FORM)
  }

  const isAssigned = worker !== null

  return (
    <div
      className={`rounded-xl border p-4 ${
        isAssigned
          ? 'border-[#e5e5e5] bg-white'
          : 'border-dashed border-[#d9d9d9] bg-[#fafafa]'
      }`}
    >
      {/* Role label + action buttons */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9b9b9b]">
            {role.label}
          </p>
          {isAssigned && !editing && (
            <p className="mt-0.5 text-xs text-[#b9b9b9]">
              Assigned {formatDate(worker.assigned_at)}
            </p>
          )}
        </div>

        {!editing && (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                isAssigned
                  ? 'border-[#d9d9d9] bg-white text-[#2b2b2b] hover:bg-[#f7f7f7]'
                  : 'border-[#1d4f91] bg-[#eef4ff] text-[#1d4f91] hover:bg-[#ddeaff]'
              }`}
            >
              {isAssigned ? 'Edit' : 'Assign'}
            </button>

            {isAssigned && !confirmRemove && (
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                className="rounded-md border border-[#f5c6c6] bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-[#fff5f5]"
              >
                Remove
              </button>
            )}

            {isAssigned && confirmRemove && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={removing}
                  className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {removing ? '...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(false)}
                  className="rounded-md border border-[#d9d9d9] bg-white px-2.5 py-1 text-xs font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assigned view */}
      {isAssigned && !editing && (
        <div className="space-y-1">
          {worker.user_name && (
            <p className="text-sm font-semibold text-[#2b2b2b]">{worker.user_name}</p>
          )}
          {worker.user_email && (
            <p className="text-xs text-[#555555]">{worker.user_email}</p>
          )}
          {worker.user_phone && (
            <p className="text-xs text-[#555555]">{worker.user_phone}</p>
          )}
          {worker.notes && (
            <p className="mt-2 rounded-md bg-[#f9f9f9] px-2.5 py-1.5 text-xs text-[#6b6b6b]">
              {worker.notes}
            </p>
          )}
        </div>
      )}

      {/* Empty unassigned state */}
      {!isAssigned && !editing && (
        <p className="text-xs text-[#b9b9b9]">Not assigned</p>
      )}

      {/* Edit / Assign form */}
      {editing && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#6b6b6b]">Name</label>
              <input
                type="text"
                value={form.user_name}
                onChange={set('user_name')}
                className="w-full rounded-md border border-[#e5e5e5] px-3 py-1.5 text-sm text-[#2b2b2b] outline-none focus:border-[#1d4f91]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#6b6b6b]">Phone</label>
              <input
                type="tel"
                value={form.user_phone}
                onChange={set('user_phone')}
                className="w-full rounded-md border border-[#e5e5e5] px-3 py-1.5 text-sm text-[#2b2b2b] outline-none focus:border-[#1d4f91]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-[#6b6b6b]">Email</label>
              <input
                type="email"
                value={form.user_email}
                onChange={set('user_email')}
                className="w-full rounded-md border border-[#e5e5e5] px-3 py-1.5 text-sm text-[#2b2b2b] outline-none focus:border-[#1d4f91]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-[#6b6b6b]">Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={set('notes')}
                className="w-full resize-none rounded-md border border-[#e5e5e5] px-3 py-1.5 text-sm text-[#2b2b2b] outline-none focus:border-[#1d4f91]"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-[#1d4f91] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1a4580] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-md border border-[#d9d9d9] bg-white px-3 py-1.5 text-xs font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CaseWorkersPanel({ caseId }: Props) {
  const supabase = useMemo(() => createClient(), [])

  const [workerMap, setWorkerMap] = useState<Partial<Record<CaseWorkerRole, CaseWorker>>>({})
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchWorkers() {
      const { data, error } = await supabase
        .from('case_workers')
        .select('*')
        .eq('case_id', caseId)

      if (error) {
        setFetchError(error.message)
      } else {
        const map: Partial<Record<CaseWorkerRole, CaseWorker>> = {}
        for (const w of data ?? []) {
          map[w.role as CaseWorkerRole] = w
        }
        setWorkerMap(map)
      }
      setLoading(false)
    }

    fetchWorkers()
  }, [caseId, supabase])

  async function handleSave(role: CaseWorkerRole, form: WorkerForm): Promise<string | null> {
    const payload = {
      case_id: caseId,
      role,
      user_name: form.user_name || null,
      user_email: form.user_email || null,
      user_phone: form.user_phone || null,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
      assigned_at: workerMap[role]?.assigned_at ?? new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('case_workers')
      .upsert(payload, { onConflict: 'case_id, role' })
      .select()
      .single()

    if (error || !data) {
      return error?.message ?? 'Failed to save'
    }

    setWorkerMap((prev) => ({ ...prev, [role]: data }))
    return null
  }

  async function handleRemove(id: string, role: CaseWorkerRole) {
    const { error } = await supabase.from('case_workers').delete().eq('id', id)
    if (!error) {
      setWorkerMap((prev) => {
        const next = { ...prev }
        delete next[role]
        return next
      })
    }
  }

  const assignedCount = Object.keys(workerMap).length

  if (loading) {
    return <p className="text-sm text-[#6b6b6b]">Loading team...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#2b2b2b]">Case Workers</h2>
        <p className="text-sm text-[#6b6b6b]">
          {assignedCount === 0
            ? 'No team members assigned'
            : `${assignedCount} of ${ROLES.length} roles assigned`}
        </p>
      </div>

      {fetchError && <p className="text-sm text-red-600">{fetchError}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map((role) => (
          <WorkerCard
            key={role.key}
            role={role}
            worker={workerMap[role.key] ?? null}
            onSave={handleSave}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  )
}
