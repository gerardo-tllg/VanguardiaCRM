"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type ConvRow = {
  caseId: string
  clientName: string
  phone: string | null
  lastBody: string
  lastDirection: "inbound" | "outbound"
  lastAt: string
}

type MsgRow = {
  id: string
  caseId: string
  direction: "inbound" | "outbound"
  body: string
  status: string
  createdAt: string
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
  cases: { client_name: string | null; phone: string | null } | null
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

type CaseOption = {
  id: string
  client_name: string | null
  case_number: string | null
}

export default function MessagesWorkspace() {
  const supabase = useMemo(() => createClient(), [])

  const [conversations, setConversations] = useState<ConvRow[]>([])
  const [messages, setMessages] = useState<MsgRow[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [unread, setUnread] = useState<Record<string, number>>({})

  // New message modal
  const [showNewMsg, setShowNewMsg] = useState(false)
  const [caseOptions, setCaseOptions] = useState<CaseOption[]>([])
  const [casesLoading, setCasesLoading] = useState(false)
  const [newPhone, setNewPhone] = useState("")
  const [newCaseId, setNewCaseId] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [newSending, setNewSending] = useState(false)
  const [newError, setNewError] = useState<string | null>(null)

  const selectedCaseIdRef = useRef<string | null>(null)
  selectedCaseIdRef.current = selectedCaseId

  const threadEndRef = useRef<HTMLDivElement>(null)

  const selectedConv = conversations.find((c) => c.caseId === selectedCaseId) ?? null

  const buildConversations = useCallback((rows: RawSmsRow[]): ConvRow[] => {
    const map = new Map<string, ConvRow>()
    for (const r of rows) {
      if (!r.case_id) continue
      if (!map.has(r.case_id)) {
        map.set(r.case_id, {
          caseId: r.case_id,
          clientName: r.cases?.client_name ?? "Unknown Client",
          phone: r.cases?.phone ?? null,
          lastBody: r.body,
          lastDirection: r.direction,
          lastAt: r.created_at,
        })
      }
    }
    return Array.from(map.values())
  }, [])

  const fetchConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from("sms_messages")
      .select("id, case_id, direction, body, status, from_number, to_number, created_at, cases(client_name, phone)")
      .not("case_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(500)

    if (error) {
      console.error("Failed to fetch conversations:", error.message)
      return
    }
    setConversations(buildConversations((data ?? []) as unknown as RawSmsRow[]))
  }, [supabase, buildConversations])

  const fetchThread = useCallback(async (caseId: string) => {
    setThreadLoading(true)
    const { data, error } = await supabase
      .from("sms_messages")
      .select("id, case_id, direction, body, status, created_at")
      .eq("case_id", caseId)
      .order("created_at", { ascending: true })
    setThreadLoading(false)

    if (error) {
      console.error("Failed to fetch thread:", error.message)
      return
    }
    setMessages(
      (data ?? []).map((r: any) => ({
        id: r.id,
        caseId: r.case_id,
        direction: r.direction,
        body: r.body,
        status: r.status,
        createdAt: r.created_at,
      }))
    )
  }, [supabase])

  const fetchCases = useCallback(async () => {
    setCasesLoading(true)
    const { data, error } = await supabase
      .from("cases")
      .select("id, client_name, case_number")
      .order("client_name", { ascending: true })
    setCasesLoading(false)
    if (error) {
      console.error("Failed to fetch cases:", error.message)
      return
    }
    setCaseOptions((data ?? []) as CaseOption[])
  }, [supabase])

  function openNewMsg() {
    setShowNewMsg(true)
    setNewPhone("")
    setNewCaseId("")
    setNewMessage("")
    setNewError(null)
    if (caseOptions.length === 0) fetchCases()
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
          case_id: newCaseId || null,
          to: newPhone.trim(),
          message: newMessage.trim(),
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        setNewError(json.error ?? "Failed to send message.")
        return
      }

      await fetchConversations()
      if (newCaseId) setSelectedCaseId(newCaseId)
      closeNewMsg()
    } finally {
      setNewSending(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchConversations().finally(() => setLoading(false))
  }, [fetchConversations])

  // Load thread on conversation select
  useEffect(() => {
    if (!selectedCaseId) return
    fetchThread(selectedCaseId)
    setUnread((prev) => ({ ...prev, [selectedCaseId]: 0 }))
  }, [selectedCaseId, fetchThread])

  // Scroll to bottom when thread updates
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Realtime subscription — uses ref to avoid re-subscribing on every conversation switch
  useEffect(() => {
    const channel = supabase
      .channel("sms_messages_live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sms_messages" },
        (payload) => {
          const row = payload.new as any
          const current = selectedCaseIdRef.current

          if (row.case_id === current) {
            setMessages((prev) => [
              ...prev,
              {
                id: row.id,
                caseId: row.case_id,
                direction: row.direction,
                body: row.body,
                status: row.status,
                createdAt: row.created_at ?? new Date().toISOString(),
              },
            ])
          } else if (row.case_id && row.direction === "inbound") {
            setUnread((prev) => ({
              ...prev,
              [row.case_id]: (prev[row.case_id] ?? 0) + 1,
            }))
          }

          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchConversations])

  async function handleSend() {
    if (!selectedCaseId || !draft.trim() || !selectedConv?.phone) return
    setSending(true)
    setSendError(null)

    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: selectedCaseId,
          to: selectedConv.phone,
          message: draft.trim(),
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
          caseId: selectedCaseId,
          direction: "outbound",
          body: draft.trim(),
          status: "sent",
          createdAt: new Date().toISOString(),
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
            {newError && (
              <p className="text-xs text-red-600">{newError}</p>
            )}

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
                Case <span className="text-[#8a8a8a] font-normal">(optional)</span>
              </label>
              <select
                value={newCaseId}
                onChange={(e) => {
                  setNewCaseId(e.target.value)
                  const chosen = caseOptions.find((c) => c.id === e.target.value)
                  if (chosen && !newPhone) {
                    // phone is on the case but not in this select — left for user to fill
                  }
                }}
                disabled={casesLoading}
                className="w-full rounded-md border border-[#d9d9d9] px-4 py-2.5 text-sm text-[#2b2b2b] outline-none focus:border-[#4b0a06] bg-white disabled:opacity-50"
              >
                <option value="">-- Select a case --</option>
                {caseOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.client_name ?? "Unknown"}{c.case_number ? ` - ${c.case_number}` : ""}
                  </option>
                ))}
              </select>
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
            const active = conv.caseId === selectedCaseId
            const unreadCount = unread[conv.caseId] ?? 0
            return (
              <button
                key={conv.caseId}
                onClick={() => setSelectedCaseId(conv.caseId)}
                className={[
                  "w-full border-b border-[#eeeeee] px-4 py-4 text-left transition",
                  active ? "bg-[#fcf8f7]" : "bg-white hover:bg-[#fcfaf9]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-[#2b2b2b] truncate">{conv.clientName}</div>
                    <div className="mt-1 text-xs text-[#6b6b6b]">{conv.phone ?? "No phone"}</div>
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
            )
          })}
        </div>
      </div>

      {/* Thread panel */}
      <div className="col-span-9 rounded-xl border border-[#e5e5e5] bg-white overflow-hidden flex flex-col">
        {!selectedCaseId ? (
          <div className="flex flex-1 items-center justify-center min-h-[70vh] text-[#8a8a8a] text-sm">
            Select a conversation to view messages.
          </div>
        ) : (
          <>
            <div className="border-b border-[#e5e5e5] px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#2b2b2b]">
                    {selectedConv?.clientName}
                  </h2>
                  <p className="mt-1 text-sm text-[#6b6b6b]">
                    {selectedConv?.phone ?? "No phone on file"}
                  </p>
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
                          "mt-2 text-xs",
                          outbound ? "text-white/80" : "text-[#8a8a8a]",
                        ].join(" ")}
                      >
                        {formatTime(msg.createdAt)}
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
              {!selectedConv?.phone && (
                <p className="mb-2 text-xs text-amber-600">
                  No phone number on file for this case. Cannot send SMS.
                </p>
              )}
              <div className="flex gap-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                  rows={3}
                  disabled={!selectedConv?.phone || sending}
                  className="flex-1 resize-none rounded-md border border-[#d9d9d9] bg-white px-4 py-3 text-sm text-[#2b2b2b] placeholder:text-[#8a8a8a] outline-none focus:border-[#4b0a06] disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || !selectedConv?.phone || sending}
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
