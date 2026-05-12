"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const CHANNEL_LABELS: Record<string, string> = {
  '+19564057494': 'Intake',
  '+19566921122': 'Out-of-State Spanish',
  '+19566921542': 'Tracking - SEO',
  '+19566921619': 'Tracking - GBP',
  '+19565946836': 'Tracking - Google Ads',
  '+19564057877': 'Tracking - Social',
  '+19565946760': 'Tracking - Referral',
}

type ConvRow = {
  externalPhone: string
  caseId: string | null
  clientName: string | null
  lastBody: string
  lastDirection: "inbound" | "outbound"
  lastAt: string
  channel: string
  viaNumber: string | null
}

type MsgRow = {
  id: string
  direction: "inbound" | "outbound"
  body: string
  status: string
  createdAt: string
  channel: string
  viaNumber: string | null
}

type RawSmsRow = {
  id: string
  case_id: string | null
  direction: "inbound" | "outbound"
  body: string
  status: string
  from_number: string | null
  to_number: string | null
  created_at: string
  channel: string
  via_number: string | null
  cases: { client_name: string | null; phone: string | null } | null
}

function normalizeToE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return phone
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    const d = digits.slice(1)
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
  }
  return phone
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" })
  return d.toLocaleDateString([], { month: "short", day: "numeric" })
}

function ChannelBadge({ channel }: { channel: string }) {
  if (channel === 'whatsapp') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
        <span>W</span> WhatsApp
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
      SMS
    </span>
  )
}

export default function MessagesWorkspace() {
  const supabase = useMemo(() => createClient(), [])

  const [conversations, setConversations] = useState<ConvRow[]>([])
  const [messages, setMessages] = useState<MsgRow[]>([])
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [unread, setUnread] = useState<Record<string, number>>({})

  const [localNames, setLocalNames] = useState<Record<string, string>>({})
  const [editingPhone, setEditingPhone] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState("")

  const [showNewMsg, setShowNewMsg] = useState(false)
  const [newPhone, setNewPhone] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [newChannel, setNewChannel] = useState<'sms' | 'whatsapp'>('sms')
  const [newSending, setNewSending] = useState(false)
  const [newError, setNewError] = useState<string | null>(null)

  const selectedPhoneRef = useRef<string | null>(null)
  selectedPhoneRef.current = selectedPhone

  const threadEndRef = useRef<HTMLDivElement>(null)

  const selectedConv = conversations.find((c) => c.externalPhone === selectedPhone) ?? null

  function getDisplayName(phone: string, clientName: string | null): string {
    return localNames[phone] ?? clientName ?? formatPhone(phone)
  }

  const buildConversations = useCallback((rows: RawSmsRow[]): ConvRow[] => {
    const map = new Map<string, ConvRow>()
    for (const r of rows) {
      const rawPhone = r.direction === "outbound" ? r.to_number : r.from_number
      if (!rawPhone) continue
      const externalPhone = normalizeToE164(rawPhone)
      if (!map.has(externalPhone)) {
        map.set(externalPhone, {
          externalPhone,
          caseId: r.case_id,
          clientName: r.cases?.client_name ?? null,
          lastBody: r.body,
          lastDirection: r.direction,
          lastAt: r.created_at,
          channel: r.channel ?? 'sms',
          viaNumber: r.via_number ?? null,
        })
      }
    }
    return Array.from(map.values())
  }, [])

  const fetchConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from("sms_messages")
      .select("id, case_id, direction, body, status, from_number, to_number, created_at, channel, via_number, cases(client_name, phone)")
      .order("created_at", { ascending: false })
      .limit(500)

    if (error) {
      console.error("[MessagesWorkspace] fetchConversations error:", error.message)
      return
    }
    const built = buildConversations((data ?? []) as unknown as RawSmsRow[])
    setConversations(built)
  }, [supabase, buildConversations])

  const fetchThread = useCallback(async (phone: string) => {
    setThreadLoading(true)
    // Build filter that matches both E.164 (+19561234567) and raw-digit (9561234567)
    // variants so existing data with inconsistent formats still loads correctly
    const norm = normalizeToE164(phone)
    const digits10 = norm.replace(/^\+1/, '')
    const filters = [`from_number.eq.${norm}`, `to_number.eq.${norm}`]
    if (digits10 !== norm) {
      filters.push(`from_number.eq.${digits10}`, `to_number.eq.${digits10}`)
    }
    const { data, error } = await supabase
      .from("sms_messages")
      .select("id, direction, body, status, created_at, channel, via_number")
      .or(filters.join(','))
      .order("created_at", { ascending: true })
    setThreadLoading(false)

    if (error) {
      console.error("[MessagesWorkspace] fetchThread error:", error.message)
      return
    }
    setMessages(
      (data ?? []).map((r: any) => ({
        id: r.id,
        direction: r.direction,
        body: r.body,
        status: r.status,
        createdAt: r.created_at,
        channel: r.channel ?? 'sms',
        viaNumber: r.via_number ?? null,
      }))
    )
  }, [supabase])

  useEffect(() => {
    fetchConversations().finally(() => setLoading(false))
  }, [fetchConversations])

  useEffect(() => {
    if (!selectedPhone) return
    fetchThread(selectedPhone)
    setUnread((prev) => ({ ...prev, [selectedPhone]: 0 }))
  }, [selectedPhone, fetchThread])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const realtimeChannel = supabase
      .channel("sms_messages_live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sms_messages" },
        (payload) => {
          const row = payload.new as any
          const current = selectedPhoneRef.current
          const externalPhone =
            row.direction === "outbound" ? row.to_number : row.from_number

          if (externalPhone && externalPhone === current) {
            setMessages((prev) => [
              ...prev,
              {
                id: row.id,
                direction: row.direction,
                body: row.body,
                status: row.status,
                createdAt: row.created_at ?? new Date().toISOString(),
                channel: row.channel ?? 'sms',
                viaNumber: row.via_number ?? null,
              },
            ])
          } else if (externalPhone && row.direction === "inbound") {
            setUnread((prev) => ({
              ...prev,
              [externalPhone]: (prev[externalPhone] ?? 0) + 1,
            }))
          }

          fetchConversations()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(realtimeChannel) }
  }, [supabase, fetchConversations])

  async function handleSend() {
    if (!selectedPhone || !draft.trim()) return
    setSending(true)
    setSendError(null)

    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: selectedConv?.caseId ?? null,
          to: selectedPhone,
          message: draft.trim(),
          channel: selectedConv?.channel ?? 'sms',
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        setSendError(json.error ?? "Failed to send message.")
        return
      }

      setMessages((prev) => [
        ...prev,
        {
          id: json.sid ?? `tmp_${Date.now()}`,
          direction: "outbound",
          body: draft.trim(),
          status: "sent",
          createdAt: new Date().toISOString(),
          channel: selectedConv?.channel ?? 'sms',
          viaNumber: selectedConv?.viaNumber ?? null,
        },
      ])
      setDraft("")
      fetchConversations()
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function openNewMsg() {
    setShowNewMsg(true)
    setNewPhone("")
    setNewMessage("")
    setNewChannel('sms')
    setNewError(null)
  }

  function closeNewMsg() {
    setShowNewMsg(false)
  }

  async function handleNewSend() {
    if (!newPhone.trim() || !newMessage.trim()) {
      setNewError("Phone number and message are required.")
      return
    }
    setNewSending(true)
    setNewError(null)

    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: newPhone.trim(),
          message: newMessage.trim(),
          channel: newChannel,
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        setNewError(json.error ?? "Failed to send message.")
        return
      }

      await fetchConversations()
      setSelectedPhone(newPhone.trim())
      closeNewMsg()
    } finally {
      setNewSending(false)
    }
  }

  function startEditName(phone: string, current: string | null) {
    setEditingPhone(phone)
    setNameInput(localNames[phone] ?? current ?? "")
  }

  function saveLocalName() {
    if (!editingPhone) return
    if (nameInput.trim()) {
      setLocalNames((prev) => ({ ...prev, [editingPhone]: nameInput.trim() }))
    } else {
      setLocalNames((prev) => {
        const next = { ...prev }
        delete next[editingPhone]
        return next
      })
    }
    setEditingPhone(null)
    setNameInput("")
  }

  return (
    <>
      {/* New Message Modal */}
      {showNewMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="border-b border-[#e5e5e5] px-6 py-4">
              <h3 className="text-base font-semibold text-[#2b2b2b]">New Message</h3>
            </div>

            <div className="px-6 py-5 space-y-4">
              {newError && <p className="text-xs text-red-600">{newError}</p>}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#555555]">
                  Channel
                </label>
                <select
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value as 'sms' | 'whatsapp')}
                  className="w-full rounded-md border border-[#d9d9d9] bg-white px-4 py-2.5 text-sm text-[#2b2b2b] outline-none focus:border-[#4b0a06]"
                >
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#555555]">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+19561234567"
                  className="w-full rounded-md border border-[#d9d9d9] px-4 py-2.5 text-sm text-[#2b2b2b] placeholder:text-[#8a8a8a] outline-none focus:border-[#4b0a06]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#555555]">
                  Message
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={4}
                  className="w-full resize-none rounded-md border border-[#d9d9d9] px-4 py-2.5 text-sm text-[#2b2b2b] placeholder:text-[#8a8a8a] outline-none focus:border-[#4b0a06]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#e5e5e5] px-6 py-4">
              <button
                onClick={closeNewMsg}
                disabled={newSending}
                className="rounded-md border border-[#d9d9d9] px-5 py-2.5 text-sm font-medium text-[#4b0a06] hover:bg-[#fdf6f5] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleNewSend}
                disabled={newSending || !newPhone.trim() || !newMessage.trim()}
                className="rounded-md bg-[#4b0a06] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5f0d08] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {newSending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3 rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
          <div className="border-b border-[#e5e5e5] px-4 py-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#2b2b2b]">Conversations</h2>
            <button
              onClick={openNewMsg}
              className="rounded-md bg-[#4b0a06] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#5f0d08]"
            >
              + New
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loading && (
              <p className="px-4 py-6 text-sm text-[#8a8a8a]">Loading...</p>
            )}
            {!loading && conversations.length === 0 && (
              <p className="px-4 py-6 text-sm text-[#8a8a8a]">No conversations yet.</p>
            )}
            {conversations.map((conv) => {
              const active = conv.externalPhone === selectedPhone
              const unreadCount = unread[conv.externalPhone] ?? 0
              const name = getDisplayName(conv.externalPhone, conv.clientName)
              const isEditing = editingPhone === conv.externalPhone
              const viaLabel = conv.viaNumber ? (CHANNEL_LABELS[conv.viaNumber] ?? conv.viaNumber) : null

              return (
                <div key={conv.externalPhone} className="border-b border-[#eeeeee]">
                  <button
                    onClick={() => setSelectedPhone(conv.externalPhone)}
                    className={[
                      "w-full px-4 py-4 text-left transition",
                      active ? "bg-[#fcf8f7]" : "bg-white hover:bg-[#fcfaf9]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-[#2b2b2b] truncate">{name}</div>
                        {conv.clientName || localNames[conv.externalPhone] ? (
                          <div className="mt-1 text-xs text-[#6b6b6b]">{formatPhone(conv.externalPhone)}</div>
                        ) : null}
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <ChannelBadge channel={conv.channel} />
                          {viaLabel && (
                            <span className="text-[10px] text-[#8a8a8a]">via {viaLabel}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-[#8a8a8a]">{formatTime(conv.lastAt)}</div>
                        {unreadCount > 0 && (
                          <div className="mt-2 inline-flex min-w-5 justify-center rounded-full bg-[#4b0a06] px-2 py-0.5 text-xs text-white">
                            {unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-[#555555] line-clamp-2">
                      {conv.lastDirection === "outbound" ? "You: " : ""}
                      {conv.lastBody}
                    </div>
                  </button>

                  {/* Add Contact inline form */}
                  <div className="px-4 pb-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveLocalName()
                            if (e.key === "Escape") setEditingPhone(null)
                          }}
                          placeholder="Enter a name..."
                          className="flex-1 rounded border border-[#d9d9d9] px-2 py-1 text-xs text-[#2b2b2b] outline-none focus:border-[#4b0a06]"
                        />
                        <button
                          onClick={saveLocalName}
                          className="text-xs font-medium text-[#4b0a06] hover:underline"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPhone(null)}
                          className="text-xs text-[#8a8a8a] hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditName(conv.externalPhone, conv.clientName)
                        }}
                        className="text-xs text-[#8a8a8a] hover:text-[#4b0a06] hover:underline"
                      >
                        {localNames[conv.externalPhone] ? "Edit name" : "+ Add name"}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Thread panel */}
        <div className="col-span-9 rounded-xl border border-[#e5e5e5] bg-white overflow-hidden flex flex-col">
          {!selectedPhone ? (
            <div className="flex flex-1 items-center justify-center min-h-[70vh] text-[#8a8a8a] text-sm">
              Select a conversation to view messages.
            </div>
          ) : (
            <>
              <div className="border-b border-[#e5e5e5] px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[#2b2b2b]">
                      {selectedConv
                        ? getDisplayName(selectedConv.externalPhone, selectedConv.clientName)
                        : selectedPhone}
                    </h2>
                    <p className="mt-1 text-sm text-[#6b6b6b]">{formatPhone(selectedPhone)}</p>
                  </div>
                  <div className="rounded-full border border-[#e4c9c4] bg-[#fdf6f5] px-4 py-2 text-sm text-[#4b0a06]">
                    Live via Twilio
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto bg-[#fafafa] p-5 min-h-[400px] max-h-[55vh]">
                {threadLoading && (
                  <p className="text-sm text-[#8a8a8a]">Loading messages...</p>
                )}
                {!threadLoading && messages.length === 0 && (
                  <p className="text-sm text-[#8a8a8a]">No messages yet.</p>
                )}
                {messages.map((msg) => {
                  const outbound = msg.direction === "outbound"
                  const viaLabel = msg.viaNumber ? (CHANNEL_LABELS[msg.viaNumber] ?? msg.viaNumber) : null
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${outbound ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={[
                          "max-w-[70%] rounded-2xl px-4 py-3 shadow-sm",
                          outbound
                            ? "bg-[#4b0a06] text-white"
                            : "bg-white border border-[#e5e5e5] text-[#2b2b2b]",
                        ].join(" ")}
                      >
                        <div className="text-sm leading-6">{msg.body}</div>
                        <div
                          className={[
                            "mt-2 flex items-center gap-2 text-xs",
                            outbound ? "text-white/70" : "text-[#8a8a8a]",
                          ].join(" ")}
                        >
                          <span>{formatTime(msg.createdAt)}</span>
                          {msg.channel === 'whatsapp' ? (
                            <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">W</span>
                          ) : (
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${outbound ? 'bg-white/20 text-white/80' : 'bg-gray-100 text-gray-500'}`}>SMS</span>
                          )}
                          {viaLabel && (
                            <span className={outbound ? "text-white/60" : "text-[#aaaaaa]"}>{viaLabel}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={threadEndRef} />
              </div>

              <div className="border-t border-[#e5e5e5] bg-white p-4">
                {sendError && (
                  <p className="mb-2 text-xs text-red-600">{sendError}</p>
                )}
                <div className="flex gap-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                    rows={3}
                    disabled={sending}
                    className="flex-1 resize-none rounded-md border border-[#d9d9d9] bg-white px-4 py-3 text-sm text-[#2b2b2b] placeholder:text-[#8a8a8a] outline-none focus:border-[#4b0a06] disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                    className="self-end rounded-md bg-[#4b0a06] px-5 py-3 text-sm font-medium text-white hover:bg-[#5f0d08] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
