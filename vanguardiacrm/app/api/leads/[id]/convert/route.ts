import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-user";

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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function getNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

function getJson(...values: unknown[]): Record<string, unknown> | null {
  for (const value of values) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    if (typeof value === "string" && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_req: Request, context: RouteContext) {
  try {
    const { response } = await requireApiUser();

    if (response) {
      return response;
    }

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

    const rawPayload = asRecord(lead.raw_payload);
    const nestedRaw = asRecord(rawPayload.raw_payload);

    const accidentLocation = getString(
      lead.accident_location,
      rawPayload.accident_location,
      nestedRaw.accident_location,
      rawPayload.location,
      nestedRaw.location
    );

    const accidentDescription = getString(
      lead.accident_description,
      rawPayload.accident_description,
      nestedRaw.accident_description,
      rawPayload.incident_description,
      nestedRaw.incident_description,
      rawPayload.intake_notes,
      nestedRaw.intake_notes,
      lead.ai_summary
    );

    const clientLanguage = getString(
      lead.client_language,
      lead.lang,
      rawPayload.client_language,
      nestedRaw.client_language,
      rawPayload.lang,
      nestedRaw.lang
    );

    const policeReportNumber = getString(
      lead.police_report_number,
      rawPayload.police_report_number,
      nestedRaw.police_report_number
    );

    const screeningScore = getNumber(
      lead.screening_score,
      rawPayload.screening_score,
      nestedRaw.screening_score
    );

    const estimatedCaseValue = getNumber(
      lead.estimated_case_value,
      rawPayload.estimated_case_value,
      nestedRaw.estimated_case_value
    );

    const liabilityAssessment = getString(
      lead.liability_assessment,
      rawPayload.liability_assessment,
      nestedRaw.liability_assessment
    );

    const injurySeverity = getString(
      lead.injury_severity,
      rawPayload.injury_severity,
      nestedRaw.injury_severity
    );

    const aiSummary = getString(
      lead.ai_summary,
      rawPayload.ai_summary,
      nestedRaw.ai_summary
    );

    const aiScreeningNotes = getJson(
      lead.ai_screening_notes,
      rawPayload.ai_screening_notes,
      nestedRaw.ai_screening_notes
    );

    const aiCaseTypeConfidence = getNumber(
      lead.ai_case_type_confidence,
      rawPayload.ai_case_type_confidence,
      nestedRaw.ai_case_type_confidence
    );

    const mergedRawPayload = {
      ...rawPayload,
      ...nestedRaw,
      source_lead_id: lead.id,
      source_lead_status: lead.status,
      accident_date: lead.accident_date,
      accident_type: lead.accident_type,
      accident_location: accidentLocation,
      accident_description: accidentDescription,
      injuries: lead.injuries,
      ai_summary: aiSummary,
      lang: lead.lang,
      client_language: clientLanguage,
      police_report_number: policeReportNumber,
      screening_score: screeningScore,
      estimated_case_value: estimatedCaseValue,
      liability_assessment: liabilityAssessment,
      injury_severity: injurySeverity,
      ai_screening_notes: aiScreeningNotes,
      ai_case_type_confidence: aiCaseTypeConfidence,
      utm_source: lead.utm_source,
      utm_campaign: lead.utm_campaign,
      external_id: lead.external_id,
      source: lead.source,
      campaign_name: lead.campaign_name,
      adset_name: lead.adset_name,
      ad_name: lead.ad_name,
      form_id: lead.form_id,
      market: lead.market,
      medium: lead.medium,
      source_campaign: lead.source_campaign,
      source_medium: lead.source_medium,
      source_channel: lead.source_channel,
    };

    const insertPayload = {
      lead_id: lead.id,
      case_number: caseNumber,
      case_type: normalizedType,
      client_name: lead.client_name,
      phone: lead.phone ?? null,
      email: lead.email ?? null,
      status: "Open",
      phase: "Welcome",
      assigned_to: null,

      client_language: clientLanguage,
      accident_date: lead.accident_date ?? null,
      accident_location: accidentLocation,
      accident_description: accidentDescription,
      police_report_number: policeReportNumber,

      screening_score: screeningScore,
      estimated_case_value: estimatedCaseValue,
      liability_assessment: liabilityAssessment,
      injury_severity: injurySeverity,
      ai_screening_notes: aiScreeningNotes,
      ai_case_type_confidence: aiCaseTypeConfidence,

      at_fault_insurer: lead.at_fault_insurer ?? null,
      at_fault_policy_number: lead.at_fault_policy_number ?? null,
      at_fault_adjuster_name: lead.at_fault_adjuster_name ?? null,
      at_fault_adjuster_phone: lead.at_fault_adjuster_phone ?? null,
      at_fault_adjuster_email: lead.at_fault_adjuster_email ?? null,
      at_fault_claim_number: lead.at_fault_claim_number ?? null,
      at_fault_policy_limits: lead.at_fault_policy_limits ?? null,

      client_insurer: lead.client_insurer ?? null,
      client_policy_number: lead.client_policy_number ?? null,
      client_claim_number: lead.client_claim_number ?? null,
      um_uim_limits: lead.um_uim_limits ?? null,
      pip_med_pay_limits: lead.pip_med_pay_limits ?? null,

      source_campaign: lead.source_campaign ?? null,
      source_medium: lead.source_medium ?? null,
      source_channel: lead.source_channel ?? null,

      updated_at: new Date().toISOString(),
      raw_payload: mergedRawPayload,
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
      .update({
        status: "Converted to Case",
        case_number: caseNumber,
        lead_id: lead.id,
        updated_at: new Date().toISOString(),
      })
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