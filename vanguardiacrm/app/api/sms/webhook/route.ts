// Twilio webhook URL to register in Twilio Console → Messaging Service → Integrations:
// https://vanguardia-crm.vercel.app/api/sms/webhook?x-vercel-protection-bypass=c5BhQKppLHO7Xh42G7fcRwekwlneqYtk
// Method: HTTP POST   Status callback: (leave blank or use the same URL)

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const TWIML_EMPTY = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'

function twiml() {
  return new NextResponse(TWIML_EMPTY, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

function stripPrefix(value: string): string {
  return value.replace(/^whatsapp:/i, '')
}

export async function POST(req: Request) {
  try {
    // Twilio sends application/x-www-form-urlencoded
    const data = await req.formData()

    const rawFrom = (data.get('From') as string | null) ?? ''
    const rawTo = (data.get('To') as string | null) ?? ''
    const body = (data.get('Body') as string | null) ?? ''
    const messageSid = (data.get('MessageSid') as string | null) ?? ''

    if (!rawFrom || !body) return twiml()

    const channel = rawTo.startsWith('whatsapp:') ? 'whatsapp' : 'sms'
    const from = stripPrefix(rawFrom)
    const to = stripPrefix(rawTo)

    const fromNormalized = normalizePhone(from)

    // Match case by client phone number stored in the cases table
    const { data: cases } = await supabaseAdmin
      .from('cases')
      .select('id, phone')
      .not('phone', 'is', null)

    const matchedCase = (cases ?? []).find((c: { id: string; phone: string | null }) => {
      if (!c.phone) return false
      return normalizePhone(c.phone) === fromNormalized
    })

    await supabaseAdmin.from('sms_messages').insert({
      case_id: matchedCase?.id ?? null,
      direction: 'inbound',
      from_number: from,
      to_number: to,
      body,
      status: 'received',
      twilio_sid: messageSid,
      sent_at: new Date().toISOString(),
      channel,
      via_number: to,
    })

    // Backfill any prior messages from this number that were saved without a case_id
    if (matchedCase) {
      await supabaseAdmin
        .from('sms_messages')
        .update({ case_id: matchedCase.id })
        .eq('from_number', from)
        .is('case_id', null)
    }

    return twiml()
  } catch (err) {
    console.error('SMS webhook error:', err)
    // Always return valid TwiML — Twilio requires a 200 response
    return twiml()
  }
}
