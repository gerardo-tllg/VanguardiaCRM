// Required env vars: NEXT_PUBLIC_APP_URL
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-user";

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return phone
}

function normalizeCaseTypeForStorage(value: string | null | undefined) {
  if (!value) return "unknown";

  const normalized = value.toLowerCase().trim();

  const map: Record<string, string> = {
    auto_accident: "motor_vehicle_accident",
    mva: "motor_vehicle_accident",
    "motor vehicle accident": "motor_vehicle_accident",
    motor_vehicle_accident: "motor_vehicle_accident",

    slip__fall: "slip_fall",
    slip_fall: "slip_fall",
    "slip / fall": "slip_fall",
    "slip and fall": "slip_fall",

    truck_accident: "truck_accident",
    "truck accident": "truck_accident",

    premises_liability: "premises_liability",
    "premises liability": "premises_liability",

    personal_injury: "personal_injury",
    "personal injury": "personal_injury",

    wrongful_death: "wrongful_death",
    "wrongful death": "wrongful_death",
  };

  return map[normalized] ?? normalized.replaceAll(" ", "_");
}

function buildCaseNumber() {
  return Date.now().toString();
}

export async function POST(req: NextRequest) {
  try {
    const { response } = await requireApiUser();

    if (response) {
      return response;
    }

    const body = await req.json();

    const clientName = normalizeString(body.client_name);
    const phone = normalizeString(body.phone) ? toE164(normalizeString(body.phone)!) : null;
    const email = normalizeString(body.email);
    const caseType = normalizeCaseTypeForStorage(
      normalizeString(body.case_type) ?? "Personal Injury"
    );
    const status = normalizeString(body.status) ?? "Welcome!";
    const assignedTo = normalizeString(body.assigned_to) ?? "Admin";
    const accidentDate = normalizeString(body.accident_date);

    const preferredLanguage = body.preferred_language === 'es' ? 'es' : 'en'

    const rawPayload =
      body.raw_payload && typeof body.raw_payload === "object"
        ? body.raw_payload
        : {};

    if (!clientName) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Phone is required" },
        { status: 400 }
      );
    }

    const caseNumber = buildCaseNumber();

    const { data, error } = await supabaseAdmin
      .from("cases")
      .insert({
        case_number: caseNumber,
        client_name: clientName,
        phone,
        email,
        case_type: caseType,
        status,
        assigned_to: assignedTo,
        accident_date: accidentDate,
        preferred_language: preferredLanguage,
        raw_payload: rawPayload,
        source_channel: "manual",
        source_medium: "internal",
        source_campaign: "manual-intake",
      })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Failed to create case" },
        { status: 500 }
      );
    }

    if (phone) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sms/phase-notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: data.id,
          phase: 'intake',
          clientPhone: phone,
          clientName: clientName,
          language: preferredLanguage,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text()
            console.error('[phase-notify] intake SMS error response:', res.status, text)
          } else {
            console.log('[phase-notify] intake SMS sent for case', data.id)
          }
        })
        .catch((err) => {
          console.error('[phase-notify] intake SMS fetch failed:', err)
        })
    }

    return NextResponse.json({ success: true, case: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create case",
      },
      { status: 500 }
    );
  }
}