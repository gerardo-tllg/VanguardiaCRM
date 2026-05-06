import { NextResponse } from 'next/server'

export async function GET() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const phone = process.env.TWILIO_PHONE_NUMBER

  const configured =
    !!sid && sid !== 'your_twilio_account_sid' &&
    !!token && token !== 'your_twilio_auth_token' &&
    !!phone && phone !== 'your_twilio_phone_number'

  return NextResponse.json({ configured })
}
