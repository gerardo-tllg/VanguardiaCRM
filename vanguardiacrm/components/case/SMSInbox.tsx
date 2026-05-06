'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SMSMessage } from '@/types/case'

type Props = {
  caseId: string
  clientPhone: string
}

const POLL_INTERVAL_MS = 30_000
const SMS_CHAR_LIMIT = 160

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

type StatusBadgeProps = { status: SMSMessage['status'] }

function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<SMSMessage['status'], string> = {
    sent:      'bg-[#f5f5f5] text-[#6b6b6b]',
    delivered: 'bg-[#ecf8f1] text-[#1f7a4d]',
    failed:    'bg-[#fff5f5] text-red-600',
    received:  'bg-[#eef4ff] text-[#1d4f91]',
  }
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  )
}

export default function SMSInbox({ caseId, clientPhone }: Props) {
  const supabase = useMemo(() => createClient(), [])

  const [messages, setMessages] = useState<SMSMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('sms_messages')
      .select('*')
      .eq('case_id', caseId)
      .order('sent_at', { ascending: true })

    if (data) setMessages(data)
  }, [caseId, supabase])

  useEffect(() => {
    async function init() {
      const [statusRes] = await Promise.all([
        fetch('/api/sms/status'),
        fetchMessages(),
      ])
      const { configured: c } = await statusRes.json()
      setConfigured(c)
      setLoading(false)
    }
    init()
  }, [fetchMessages])

  useEffect(() => {
    const id = setInterval(fetchMessages, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const body = draft.trim()
    if (!body || sending || !clientPhone) return

    setSending(true)
    setSendError(null)

    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_id: caseId, to: clientPhone, message: body }),
    })

    const result = await res.json()

    if (!res.ok || !result.success) {
      if (res.status === 503) setConfigured(false)
      setSendError(result.error ?? 'Failed to send')
      setSending(false)
      return
    }

    setDraft('')
    setSending(false)
    await fetchMessages()
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) {
    return <p className="text-sm text-[#6b6b6b]">Loading inbox...</p>
  }

  const noPhone = !clientPhone
  const composeDisabled = sending || configured === false || noPhone
  const remaining = SMS_CHAR_LIMIT - draft.length

  return (
    <div className="flex h-full min-h-[520px] flex-col rounded-xl border border-[#e5e5e5] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5e5e5] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[#2b2b2b]">SMS Inbox</h2>
          {noPhone ? (
            <p className="text-xs font-medium text-red-500">No phone number on file</p>
          ) : (
            <p className="text-xs text-[#9b9b9b]">{clientPhone}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-2 w-2 rounded-full ${
              configured === null
                ? 'animate-pulse bg-[#d9d9d9]'
                : configured
                  ? 'bg-[#1f7a4d]'
                  : 'bg-[#d9d9d9]'
            }`}
          />
          <span className="text-xs text-[#9b9b9b]">
            {configured === null ? 'Checking...' : configured ? 'Active' : 'Not configured'}
          </span>
          <button
            type="button"
            onClick={fetchMessages}
            title="Refresh"
            className="ml-1 rounded-md border border-[#e5e5e5] p-1.5 text-[#9b9b9b] hover:bg-[#f7f7f7] hover:text-[#2b2b2b]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 1 0 4.582 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* No phone banner */}
      {noPhone && (
        <div className="flex items-center gap-3 border-b border-[#f5c6c6] bg-[#fff5f5] px-5 py-3">
          <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
          <p className="text-xs font-medium text-red-600">
            No phone number on file. Add a client phone number to this case to enable SMS.
          </p>
        </div>
      )}

      {/* Not configured banner */}
      {configured === false && !noPhone && (
        <div className="flex items-center gap-3 border-b border-[#f1d9a6] bg-[#fff8e8] px-5 py-3">
          <svg className="h-4 w-4 shrink-0 text-[#8a5a00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
          <p className="text-xs font-medium text-[#8a5a00]">
            SMS is not set up yet. Contact your administrator to activate messaging.
          </p>
        </div>
      )}

      {/* Message thread */}
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[#b9b9b9]">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOutbound = msg.direction === 'outbound'
            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${isOutbound ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isOutbound
                      ? 'rounded-br-sm bg-[#1d4f91] text-white'
                      : 'rounded-bl-sm bg-[#f3f3f3] text-[#2b2b2b]'
                  }`}
                >
                  {msg.body}
                </div>
                <div className={`flex items-center gap-2 ${isOutbound ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-[10px] text-[#b9b9b9]">{formatTime(msg.sent_at)}</span>
                  <StatusBadge status={msg.status} />
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose area */}
      <div className="border-t border-[#e5e5e5] px-4 py-3">
        {sendError && (
          <p className="mb-2 text-xs text-red-600">{sendError}</p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              noPhone
                ? 'No phone number on file'
                : configured === false
                  ? 'SMS not configured'
                  : 'Type a message... (Enter to send)'
            }
            disabled={composeDisabled}
            maxLength={SMS_CHAR_LIMIT}
            className="flex-1 resize-none rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm text-[#2b2b2b] outline-none focus:border-[#1d4f91] disabled:bg-[#f9f9f9] disabled:text-[#9b9b9b]"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={composeDisabled || !draft.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1d4f91] text-white transition-colors hover:bg-[#1a4580] disabled:cursor-not-allowed disabled:opacity-40"
            title="Send"
          >
            {sending ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 translate-x-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-[10px] text-[#b9b9b9]">Shift+Enter for new line</p>
          <p className={`text-[10px] font-medium ${remaining < 20 ? 'text-red-500' : 'text-[#b9b9b9]'}`}>
            {remaining} characters remaining
          </p>
        </div>
      </div>
    </div>
  )
}
