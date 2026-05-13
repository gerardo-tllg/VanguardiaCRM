import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireApiUser } from '@/lib/auth/require-api-user'

const PHASE_MESSAGES: Record<string, (name: string) => string> = {
  intake: (name) =>
    `Hi ${name}, welcome to The Lopez Law Group. We have officially opened your case and our team is ready to fight for you. We will keep you updated every step of the way.\n\nHola ${name}, bienvenido a The Lopez Law Group. Hemos abierto su caso oficialmente y nuestro equipo está listo para luchar por usted.`,
  treatment: (name) =>
    `Hi ${name}, your case is now in the Treatment phase. Please continue attending all medical appointments — this is critical for your case. Contact us anytime with questions.\n\nHola ${name}, su caso está ahora en la fase de Tratamiento. Por favor continúe asistiendo a todas sus citas médicas — esto es fundamental para su caso.`,
  demand: (name) =>
    `Hi ${name}, we are now preparing your demand package to submit to the insurance company. We will notify you once it has been sent.\n\nHola ${name}, estamos preparando su paquete de demanda para enviarlo a la aseguradora. Le notificaremos una vez que sea enviado.`,
  negotiation: (name) =>
    `Hi ${name}, your case has entered the Negotiation phase. Our attorneys are actively negotiating with the insurance company on your behalf. We will update you as things progress.\n\nHola ${name}, su caso ha entrado en la fase de Negociación. Nuestros abogados están negociando activamente con la aseguradora en su nombre.`,
  settlement: (name) =>
    `Hi ${name}, great news — your case has reached a settlement! Our team will be in touch shortly to walk you through the next steps.\n\nHola ${name}, excelentes noticias — su caso ha llegado a un acuerdo. Nuestro equipo se comunicará pronto para explicarle los próximos pasos.`,
  litigation: (name) =>
    `Hi ${name}, your case has moved to the Litigation phase. Our legal team is preparing to file suit on your behalf. We will keep you closely informed throughout this process.\n\nHola ${name}, su caso ha pasado a la fase de Litigación. Nuestro equipo legal se está preparando para presentar una demanda en su nombre.`,
  closed: (name) =>
    `Hi ${name}, your case with The Lopez Law Group is now closed. It was an honor to represent you. Please do not hesitate to refer friends or family who may need legal help.\n\nHola ${name}, su caso con The Lopez Law Group ha sido cerrado. Fue un honor representarle. No dude en referirnos a amigos o familiares que necesiten ayuda legal.`,
}

export async function POST(req: Request) {
  try {
    const { response } = await requireApiUser()
    if (response) return response

    const { caseId, phase, clientPhone, clientName } = await req.json() as {
      caseId: string
      phase: string
      clientPhone: string
      clientName?: string
    }

    const template = PHASE_MESSAGES[phase]
    if (!template) {
      return NextResponse.json({ skipped: true })
    }

    const name = clientName?.trim() || 'there'
    const message = template(name)

    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
    const fromNumber = process.env.TWILIO_INTAKE_NUMBER

    if (!sid || !token || (!messagingServiceSid && !fromNumber)) {
      return NextResponse.json({ success: false, error: 'Twilio not configured' }, { status: 503 })
    }

    const digits = clientPhone.replace(/\D/g, '')
    const toNormalized =
      digits.length === 10
        ? `+1${digits}`
        : digits.length === 11 && digits.startsWith('1')
          ? `+${digits}`
          : clientPhone

    const client = twilio(sid, token)

    const sent = await client.messages.create(
      messagingServiceSid
        ? { body: message, messagingServiceSid, to: toNormalized }
        : { body: message, from: fromNumber!, to: toNormalized }
    )

    const { error: dbError } = await supabaseAdmin.from('sms_messages').insert({
      case_id: caseId,
      direction: 'outbound',
      from_number: fromNumber ?? null,
      to_number: toNormalized,
      body: message,
      status: 'sent',
      twilio_sid: sent.sid,
      sent_at: new Date().toISOString(),
      channel: 'sms',
      via_number: fromNumber ?? null,
    })

    if (dbError) {
      console.error('Phase notify SMS log insert failed:', dbError.message)
    }

    return NextResponse.json({ success: true, sid: sent.sid })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send phase notification'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
