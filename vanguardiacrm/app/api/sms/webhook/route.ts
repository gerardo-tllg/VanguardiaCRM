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

export async function POST(req: Request) {
  try {
    // Twilio sends application/x-www-form-urlencoded
    const data = await req.formData()

    const from = (data.get('From') as string | null) ?? ''
    const to = (data.get('To') as string | null) ?? ''
    const body = (data.get('Body') as string | null) ?? ''
    const messageSid = (data.get('MessageSid') as string | null) ?? ''

    if (!from || !body) return twiml()

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
    })

    return twiml()
  } catch (err) {
    console.error('SMS webhook error:', err)
    // Always return valid TwiML — Twilio requires a 200 response
    return twiml()
  }
}
