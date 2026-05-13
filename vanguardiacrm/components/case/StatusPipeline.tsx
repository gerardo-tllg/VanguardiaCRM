'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CaseStatus } from '@/types/case'
import { PIPELINE, getPhaseIndex, getNextPhase, PipelinePhase } from '@/lib/casePipeline'

type Props = {
  caseId: string
  currentStatus?: CaseStatus
  clientPhone?: string
  clientName?: string
  onStatusChange?: (newStatus: CaseStatus) => void
}

export default function StatusPipeline({ caseId, currentStatus = 'intake', clientPhone, clientName, onStatusChange }: Props) {
  const [localStatus, setLocalStatus] = useState<CaseStatus>(currentStatus)
  const [selectedPhase, setSelectedPhase] = useState<CaseStatus | null>(null)
  const [checkedTriggers, setCheckedTriggers] = useState<Set<string>>(new Set())
  const [advancing, setAdvancing] = useState(false)
  const [confirmAdvance, setConfirmAdvance] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const currentIndex = getPhaseIndex(localStatus)
  const nextPhase: PipelinePhase | null = getNextPhase(localStatus)
  const selectedPipelinePhase = selectedPhase
    ? PIPELINE.find((p) => p.status === selectedPhase) ?? null
    : null

  function handlePhaseClick(status: CaseStatus) {
    setSelectedPhase((prev) => (prev === status ? null : status))
  }

  function toggleTrigger(key: string) {
    setCheckedTriggers((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function advanceToNextPhase() {
    if (!nextPhase) return

    setAdvancing(true)
    setError(null)
    setConfirmAdvance(false)

    const { error: dbError } = await supabase
      .from('cases')
      .update({
        case_status: nextPhase.status,
        automation_phase: nextPhase.status,
        last_status_change: new Date().toISOString(),
      })
      .eq('id', caseId)

    setAdvancing(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    setLocalStatus(nextPhase.status)
    setSelectedPhase(null)
    onStatusChange?.(nextPhase.status)

    if (clientPhone) {
      fetch('/api/sms/phase-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          phase: nextPhase.status,
          clientPhone,
          clientName,
        }),
      }).catch(() => {})
    }
  }

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#6b6b6b]">
        Case Status Pipeline
      </p>

      {/* Pipeline steps */}
      <div className="flex items-start overflow-x-auto pb-2">
        {PIPELINE.map((phase, index) => {
          const isCompleted = index < currentIndex
          const isActive = index === currentIndex
          const isSelected = selectedPhase === phase.status

          return (
            <div key={phase.status} className="flex items-center">
              <button
                type="button"
                title="Click to view triggers"
                onClick={() => handlePhaseClick(phase.status)}
                className={`flex min-w-[84px] cursor-pointer flex-col items-center gap-1.5 rounded-lg px-2 py-2 transition-colors ${
                  isSelected ? 'bg-[#eef4ff]' : 'hover:bg-[#f7f7f7]'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                    isCompleted
                      ? 'border-[#1f7a4d] bg-[#1f7a4d] text-white'
                      : isActive
                        ? 'border-[#1d4f91] bg-[#1d4f91] text-white'
                        : 'border-[#d9d9d9] bg-white text-[#9b9b9b]'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                <span
                  className={`text-center text-xs font-medium leading-tight ${
                    isCompleted
                      ? 'text-[#1f7a4d]'
                      : isActive
                        ? 'text-[#1d4f91]'
                        : 'text-[#9b9b9b]'
                  }`}
                >
                  {phase.label}
                </span>
              </button>

              {index < PIPELINE.length - 1 && (
                <div
                  className={`h-0.5 w-5 flex-shrink-0 transition-colors ${
                    index < currentIndex ? 'bg-[#1f7a4d]' : 'bg-[#e5e5e5]'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Detail panel */}
      {selectedPipelinePhase && (
        <div className="mt-4 rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#2b2b2b]">
              {selectedPipelinePhase.label}: Triggers
            </h3>
            <button
              type="button"
              onClick={() => setSelectedPhase(null)}
              className="text-lg leading-none text-[#9b9b9b] hover:text-[#2b2b2b]"
            >
              &times;
            </button>
          </div>

          <div className="mb-4 space-y-2">
            {selectedPipelinePhase.triggers.map((trigger) => (
              <label key={trigger.key} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={checkedTriggers.has(trigger.key)}
                  onChange={() => toggleTrigger(trigger.key)}
                  className="h-4 w-4 rounded border-[#d9d9d9] accent-[#1d4f91]"
                />
                <span className="text-sm text-[#2b2b2b]">{trigger.label}</span>
              </label>
            ))}
          </div>

          {selectedPipelinePhase.automationAction ? (
            <div className="rounded-md border border-[#c9daf7] bg-[#eef4ff] px-3 py-2">
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-[#1d4f91]">
                Automation Action
              </p>
              <p className="text-sm text-[#1d4f91]">{selectedPipelinePhase.automationAction}</p>
            </div>
          ) : (
            <div className="rounded-md border border-[#e5e5e5] bg-white px-3 py-2">
              <p className="text-sm text-[#9b9b9b]">No automation action configured for this phase.</p>
            </div>
          )}
        </div>
      )}

      {/* Advance button row */}
      <div className="mt-5">
        {confirmAdvance && nextPhase ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#f1d9a6] bg-[#fff8e8] px-4 py-3">
            <p className="text-sm text-[#8a5a00]">
              Advance case to <span className="font-semibold">{nextPhase.label}</span>? This cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={advanceToNextPhase}
                disabled={advancing}
                className="rounded-md bg-[#1d4f91] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4580] disabled:opacity-50"
              >
                {advancing ? 'Advancing...' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmAdvance(false)}
                className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setError(null); setConfirmAdvance(true) }}
              disabled={!nextPhase}
              className="rounded-md bg-[#1d4f91] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a4580] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {nextPhase ? `Advance to ${nextPhase.label}` : 'Final Phase Reached'}
            </button>

            <span className="text-sm text-[#6b6b6b]">
              Current:{' '}
              <span className="font-medium text-[#2b2b2b]">
                {PIPELINE[currentIndex]?.label ?? localStatus}
              </span>
            </span>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
