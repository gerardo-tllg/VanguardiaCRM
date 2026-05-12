import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireApiUser } from '@/lib/auth/require-api-user'

export async function POST(req: Request) {
  try {
    const { response } = await requireApiUser()
    if (response) return response

    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
    const from = process.env.TWILIO_INTAKE_NUMBER

    if (!sid || !token || (!messagingServiceSid && !from)) {
      return NextResponse.json(
        { success: false, error: 'Twilio not configured' },
        { status: 503 }
      )
    }

    const body = await req.json()
    const { case_id, to, message, channel = 'sms' } = body as {
      case_id?: string | null
      to: string
      message: string
      channel?: string
    }

    if (!to || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'to and message are required' },
        { status: 400 }
      )
    }

    const client = twilio(sid, token)

    const twilioTo = channel === 'whatsapp' ? `whatsapp:${to}` : to
    const twilioFrom = channel === 'whatsapp' ? `whatsapp:${from}` : from

    const sent = await client.messages.create(
      channel === 'whatsapp'
        ? { body: message.trim(), from: twilioFrom!, to: twilioTo }
        : messagingServiceSid
          ? { body: message.trim(), messagingServiceSid, to: twilioTo }
          : { body: message.trim(), from: twilioFrom!, to: twilioTo }
    )

    const { error: dbError } = await supabaseAdmin.from('sms_messages').insert({
      case_id: case_id ?? null,
      direction: 'outbound',
      from_number: from ?? null,
      to_number: to,
      body: message.trim(),
      status: 'sent',
      twilio_sid: sent.sid,
      sent_at: new Date().toISOString(),
      channel,
      via_number: from ?? null,
    })

    if (dbError) {
      console.error('SMS log insert failed:', dbError.message)
    }

    return NextResponse.json({ success: true, sid: sent.sid })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send SMS'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
