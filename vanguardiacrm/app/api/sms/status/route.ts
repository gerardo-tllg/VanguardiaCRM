import { NextResponse } from 'next/server'

export async function GET() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
  const from = process.env.TWILIO_INTAKE_NUMBER

  const configured = !!sid && !!token && (!!messagingServiceSid || !!from)

  return NextResponse.json({ configured })
}
