import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const CASE_TYPE_CODES: Record<string, string> = {
  auto_accident: "AA",
  truck_accident: "TA",
  premises_liability: "PL",
  slip_fall: "SF",
  motor_vehicle_accident: "MVA",
  mva: "MVA",
  unknown: "OT",
};

function normalizeCaseType(value: string | null | undefined) {
  if (!value) return "unknown";

  return value
    .toLowerCase()
    .trim()
    .replaceAll("&", "and")
    .replaceAll("/", " ")
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function buildCasePrefix(accidentType: string | null | undefined) {
  const normalizedType = normalizeCaseType(accidentType);
  const typeCode = CASE_TYPE_CODES[normalizedType] || "OT";
  const year = new Date().getFullYear();

  return {
    normalizedType,
    typeCode,
    prefix: `VL-${year}-${typeCode}-`,
  };
}

function getNextSequence(existingCaseNumbers: string[], prefix: string) {
  const usedNumbers = existingCaseNumbers
    .filter((value) => value.startsWith(prefix))
    .map((value) => {
      const suffix = value.slice(prefix.length);
      const parsed = Number.parseInt(suffix, 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    });

  const maxUsed = usedNumbers.length > 0 ? Math.max(...usedNumbers) : 0;
  return String(maxUsed + 1).padStart(4, "0");
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const { data: existingCase, error: existingCaseError } = await supabaseAdmin
      .from("cases")
      .select("id, case_number")
      .eq("lead_id", id)
      .maybeSingle();

    if (existingCaseError) {
      return NextResponse.json(
        { error: existingCaseError.message },
        { status: 500 }
      );
    }

    if (existingCase) {
      return NextResponse.json(
        {
          success: true,
          case: existingCase,
          redirectTo: `/cases/${existingCase.case_number}/overview`,
        },
        { status: 200 }
      );
    }

    const { normalizedType, prefix } = buildCasePrefix(lead.accident_type);

    const { data: existingCasesForType, error: existingCasesError } =
      await supabaseAdmin
        .from("cases")
        .select("case_number")
        .ilike("case_number", `${prefix}%`);

    if (existingCasesError) {
      return NextResponse.json(
        { error: existingCasesError.message },
        { status: 500 }
      );
    }

    const caseNumbers = (existingCasesForType ?? [])
      .map((row) => row.case_number)
      .filter((value): value is string => Boolean(value));

    const nextSequence = getNextSequence(caseNumbers, prefix);
    const caseNumber = `${prefix}${nextSequence}`;

    const rawPayload =
      lead.raw_payload && typeof lead.raw_payload === "object"
        ? (lead.raw_payload as Record<string, unknown>)
        : {};

    const insertPayload = {
      lead_id: lead.id,
      case_number: caseNumber,
      client_name: lead.client_name,
      case_type: normalizedType,
      phone: lead.phone ?? null,
      email: lead.email ?? null,
      status: "Open",
      phase: "Welcome",
      assigned_to: null,
      raw_payload: {
        ...rawPayload,
        accident_date: lead.accident_date,
        accident_type: lead.accident_type,
        injuries: lead.injuries,
        ai_summary: lead.ai_summary,
        lang: lead.lang,
        utm_source: lead.utm_source,
        utm_campaign: lead.utm_campaign,
        source_lead_id: lead.id,
      },
    };

    const { data: newCase, error: caseError } = await supabaseAdmin
      .from("cases")
      .insert(insertPayload)
      .select()
      .single();

    if (caseError || !newCase) {
      return NextResponse.json(
        { error: caseError?.message || "Failed to create case" },
        { status: 500 }
      );
    }

    const { error: leadUpdateError } = await supabaseAdmin
      .from("leads")
      .update({ status: "Converted to Case" })
      .eq("id", lead.id);

    if (leadUpdateError) {
      return NextResponse.json(
        { error: leadUpdateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        case: newCase,
        redirectTo: `/cases/${newCase.case_number}/overview`,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}