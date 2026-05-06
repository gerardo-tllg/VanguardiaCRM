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
    const from = process.env.TWILIO_PHONE_NUMBER

    if (
      !sid || sid === 'your_twilio_account_sid' ||
      !token || token === 'your_twilio_auth_token' ||
      !from || from === 'your_twilio_phone_number'
    ) {
      return NextResponse.json(
        { success: false, error: 'Twilio not configured' },
        { status: 503 }
      )
    }

    const body = await req.json()
    const { case_id, to, message } = body as {
      case_id: string
      to: string
      message: string
    }

    if (!case_id || !to || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'case_id, to, and message are required' },
        { status: 400 }
      )
    }

    const client = twilio(sid, token)

    const sent = await client.messages.create({
      body: message.trim(),
      from,
      to,
    })

    const { error: dbError } = await supabaseAdmin.from('sms_messages').insert({
      case_id,
      direction: 'outbound',
      from_number: from,
      to_number: to,
      body: message.trim(),
      status: 'sent',
      twilio_sid: sent.sid,
      sent_at: new Date().toISOString(),
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
