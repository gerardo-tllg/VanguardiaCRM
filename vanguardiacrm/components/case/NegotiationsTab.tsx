'use client'

import { useCallback, useEffect, useState } from 'react'

type Negotiation = {
  id: string
  case_id: string
  offer_date: string
  offer_by: 'insurance' | 'firm'
  amount: number
  notes: string | null
  created_at: string
}

type Props = { caseId: string }

function usd(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function diffLabel(current: number, previous: number | null): string | null {
  if (previous == null) return null
  const delta = current - previous
  if (delta === 0) return 'No change'
  return (delta > 0 ? '+' : '') + usd(delta)
}

export default function NegotiationsTab({ caseId }: Props) {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [date, setDate] = useState(today())
  const [offerBy, setOfferBy] = useState<'insurance' | 'firm'>('insurance')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const fetchNegotiations = useCallback(async () => {
    setError(null)
    const res = await fetch(`/api/negotiations?case_id=${caseId}`)
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Failed to load negotiations')
    } else {
      setNegotiations(json.data ?? [])
    }
    setLoading(false)
  }, [caseId])

  useEffect(() => { fetchNegotiations() }, [fetchNegotiations])

  async function handleAdd() {
    const parsedAmount = parseFloat(amount.replace(/[$,]/g, ''))
    if (!date || isNaN(parsedAmount) || parsedAmount <= 0) {
      setAddError('Date and a valid amount are required.')
      return
    }
    setAdding(true)
    setAddError(null)
    const res = await fetch('/api/negotiations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_id: caseId, offer_date: date, offer_by: offerBy, amount: parsedAmount, notes: notes || null }),
    })
    const json = await res.json()
    if (!res.ok) {
      setAddError(json.error ?? 'Failed to add offer')
    } else {
      setNegotiations((prev) => [...prev, json.data].sort((a, b) =>
        a.offer_date < b.offer_date ? -1 : a.offer_date > b.offer_date ? 1 :
        a.created_at < b.created_at ? -1 : 1
      ))
      setAmount('')
      setNotes('')
      setDate(today())
    }
    setAdding(false)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/negotiations/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setNegotiations((prev) => prev.filter((n) => n.id !== id))
    }
  }

  // ── Stats ────────────────────────────────────────────────────────────────────
  const totalOffers = negotiations.length
  const lastOffer = negotiations[negotiations.length - 1] ?? null
  const bestInsurance = negotiations
    .filter((n) => n.offer_by === 'insurance')
    .reduce<number | null>((max, n) => (max == null || n.amount > max ? n.amount : max), null)
  const ourLastDemand = [...negotiations].reverse().find((n) => n.offer_by === 'firm') ?? null

  return (
    <div className="space-y-5">

      {/* ── Summary stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Offers', value: totalOffers === 0 ? '—' : String(totalOffers) },
          {
            label: 'Last Offer',
            value: lastOffer ? usd(lastOffer.amount) : '—',
            sub: lastOffer ? (lastOffer.offer_by === 'insurance' ? 'Insurance' : 'Our Firm') : undefined,
          },
          { label: 'Best Insurance Offer', value: bestInsurance != null ? usd(bestInsurance) : '—' },
          { label: 'Our Last Demand', value: ourLastDemand ? usd(ourLastDemand.amount) : '—' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[#e5e5e5] bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9b9b9b]">{stat.label}</p>
            <p className="mt-1 text-xl font-bold text-[#2b2b2b]">{stat.value}</p>
            {stat.sub && <p className="text-xs text-[#6b6b6b]">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Add offer form ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
        <p className="mb-4 text-sm font-semibold text-[#2b2b2b]">Add New Offer</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#6b6b6b]">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm text-[#2b2b2b] outline-none focus:border-[#1d4f91]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#6b6b6b]">Made By</label>
            <div className="flex rounded-lg border border-[#e5e5e5] overflow-hidden text-sm font-medium">
              <button
                type="button"
                onClick={() => setOfferBy('insurance')}
                className={`px-4 py-2 transition ${offerBy === 'insurance' ? 'bg-[#fef2f2] text-[#b91c1c]' : 'bg-white text-[#6b6b6b] hover:bg-[#f9f9f9]'}`}
              >
                Insurance
              </button>
              <button
                type="button"
                onClick={() => setOfferBy('firm')}
                className={`px-4 py-2 border-l border-[#e5e5e5] transition ${offerBy === 'firm' ? 'bg-[#eff6ff] text-[#1d4f91]' : 'bg-white text-[#6b6b6b] hover:bg-[#f9f9f9]'}`}
              >
                Our Firm
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#6b6b6b]">Amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-[#9b9b9b]">$</span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-36 rounded-lg border border-[#e5e5e5] py-2 pl-7 pr-3 text-sm text-[#2b2b2b] outline-none focus:border-[#1d4f91]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
            <label className="text-xs font-medium text-[#6b6b6b]">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Counter to policy limits demand"
              className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm text-[#2b2b2b] outline-none focus:border-[#1d4f91]"
            />
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            className="rounded-lg bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add Offer'}
          </button>
        </div>
        {addError && <p className="mt-2 text-xs text-red-600">{addError}</p>}
      </div>

      {/* ── Offer history ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
        <div className="border-b border-[#e5e5e5] px-5 py-3">
          <p className="text-sm font-semibold text-[#2b2b2b]">Offer History</p>
        </div>

        {loading ? (
          <p className="px-5 py-6 text-sm text-[#9b9b9b]">Loading...</p>
        ) : error ? (
          <p className="px-5 py-6 text-sm text-red-600">{error}</p>
        ) : negotiations.length === 0 ? (
          <p className="px-5 py-6 text-sm italic text-[#b9b9b9]">No offers recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f3f3f3] bg-[#fafafa]">
                <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[#9b9b9b]">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[#9b9b9b]">Made By</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-[#9b9b9b]">Amount</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-[#9b9b9b]">Change</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[#9b9b9b]">Notes</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {negotiations.map((n, idx) => {
                const prev = idx > 0 ? negotiations[idx - 1].amount : null
                const diff = diffLabel(n.amount, prev)
                const isInsurance = n.offer_by === 'insurance'
                const positive = prev != null && n.amount > prev
                const negative = prev != null && n.amount < prev

                return (
                  <tr
                    key={n.id}
                    className={`border-b border-[#f3f3f3] last:border-0 ${isInsurance ? 'bg-[#fff8f8]' : 'bg-[#f5f8ff]'}`}
                  >
                    <td className="px-5 py-3 text-[#2b2b2b]">
                      {new Date(n.offer_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isInsurance
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isInsurance ? 'Insurance' : 'Our Firm'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#2b2b2b]">
                      {usd(n.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {diff == null ? (
                        <span className="text-xs text-[#b9b9b9]">—</span>
                      ) : (
                        <span className={`text-xs font-medium ${
                          positive ? 'text-green-600' : negative ? 'text-red-500' : 'text-[#9b9b9b]'
                        }`}>
                          {diff}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#6b6b6b]">
                      {n.notes ?? <span className="italic text-[#c9c9c9]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(n.id)}
                        className="rounded-md border border-[#f3d0ce] bg-white px-2.5 py-1 text-xs font-medium text-[#b91c1c] hover:bg-[#fff0ef]"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
