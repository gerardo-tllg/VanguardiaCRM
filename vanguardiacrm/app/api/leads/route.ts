import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type JsonObject = Record<string, unknown>;

type CreateLeadBody = {
  client_name?: string;
  phone?: string | null;
  email?: string | null;
  accident_date?: string | null;
  accident_type?: string | null;
  injuries?: string | null;
  ai_summary?: string | null;
  lang?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;

  accident_location?: string | null;
  accident_description?: string | null;
  client_language?: string | null;
  police_report_number?: string | null;

  screening_score?: string | number | null;
  estimated_case_value?: string | number | null;
  liability_assessment?: string | null;
  injury_severity?: string | null;
  ai_screening_notes?: JsonObject | string | null;
  ai_case_type_confidence?: string | number | null;

  external_id?: string | null;
  source?: string | null;
  campaign_name?: string | null;
  adset_name?: string | null;
  ad_name?: string | null;
  form_id?: string | null;
  market?: string | null;
  medium?: string | null;
  source_campaign?: string | null;
  source_medium?: string | null;
  source_channel?: string | null;

  at_fault_insurer?: string | null;
  at_fault_policy_number?: string | null;
  at_fault_adjuster_name?: string | null;
  at_fault_adjuster_phone?: string | null;
  at_fault_adjuster_email?: string | null;
  at_fault_claim_number?: string | null;
  at_fault_policy_limits?: string | number | null;

  client_insurer?: string | null;
  client_policy_number?: string | null;
  client_claim_number?: string | null;
  um_uim_limits?: string | number | null;
  pip_med_pay_limits?: string | number | null;

  raw_payload?: JsonObject | null;
};

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
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

function getJson(...values: unknown[]): JsonObject | null {
  for (const value of values) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as JsonObject;
    }

    if (typeof value === "string" && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed as JsonObject;
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateLeadBody;

    const clientName = body.client_name?.trim();
    if (!clientName) {
      return NextResponse.json(
        { error: "client_name is required" },
        { status: 400 }
      );
    }

    const raw = asRecord(body.raw_payload);
    const nestedRaw = asRecord(raw.raw_payload);

    const insertPayload = {
      client_name: clientName,
      phone: getString(body.phone, raw.phone, nestedRaw.phone),
      email: getString(body.email, raw.email, nestedRaw.email),
      accident_date: getString(
        body.accident_date,
        raw.accident_date,
        nestedRaw.accident_date
      ),
      accident_type: getString(
        body.accident_type,
        raw.accident_type,
        nestedRaw.accident_type
      ),
      injuries: getString(body.injuries, raw.injuries, nestedRaw.injuries),
      ai_summary: getString(
        body.ai_summary,
        raw.ai_summary,
        nestedRaw.ai_summary
      ),
      lang: getString(body.lang, raw.lang, nestedRaw.lang),
      utm_source: getString(
        body.utm_source,
        raw.utm_source,
        nestedRaw.utm_source
      ) ?? "manual",
      utm_campaign: getString(
        body.utm_campaign,
        raw.utm_campaign,
        nestedRaw.utm_campaign
      ) ?? "manual-entry",

      accident_location: getString(
        body.accident_location,
        raw.accident_location,
        nestedRaw.accident_location,
        raw.location,
        nestedRaw.location
      ),
      accident_description: getString(
        body.accident_description,
        raw.accident_description,
        nestedRaw.accident_description,
        raw.incident_description,
        nestedRaw.incident_description,
        raw.intake_notes,
        nestedRaw.intake_notes
      ),
      client_language: getString(
        body.client_language,
        body.lang,
        raw.client_language,
        nestedRaw.client_language,
        raw.lang,
        nestedRaw.lang
      ),
      police_report_number: getString(
        body.police_report_number,
        raw.police_report_number,
        nestedRaw.police_report_number
      ),

      screening_score: getNumber(
        body.screening_score,
        raw.screening_score,
        nestedRaw.screening_score
      ),
      estimated_case_value: getNumber(
        body.estimated_case_value,
        raw.estimated_case_value,
        nestedRaw.estimated_case_value
      ),
      liability_assessment: getString(
        body.liability_assessment,
        raw.liability_assessment,
        nestedRaw.liability_assessment
      ),
      injury_severity: getString(
        body.injury_severity,
        raw.injury_severity,
        nestedRaw.injury_severity
      ),
      ai_screening_notes: getJson(
        body.ai_screening_notes,
        raw.ai_screening_notes,
        nestedRaw.ai_screening_notes
      ),
      ai_case_type_confidence: getNumber(
        body.ai_case_type_confidence,
        raw.ai_case_type_confidence,
        nestedRaw.ai_case_type_confidence
      ),

      external_id: getString(body.external_id, raw.external_id, nestedRaw.external_id),
      source: getString(body.source, raw.source, nestedRaw.source),
      campaign_name: getString(
        body.campaign_name,
        raw.campaign_name,
        nestedRaw.campaign_name
      ),
      adset_name: getString(body.adset_name, raw.adset_name, nestedRaw.adset_name),
      ad_name: getString(body.ad_name, raw.ad_name, nestedRaw.ad_name),
      form_id: getString(body.form_id, raw.form_id, nestedRaw.form_id),
      market: getString(body.market, raw.market, nestedRaw.market),
      medium: getString(body.medium, raw.medium, nestedRaw.medium),
      source_campaign: getString(
        body.source_campaign,
        raw.source_campaign,
        nestedRaw.source_campaign
      ),
      source_medium: getString(
        body.source_medium,
        raw.source_medium,
        nestedRaw.source_medium
      ),
      source_channel: getString(
        body.source_channel,
        raw.source_channel,
        nestedRaw.source_channel
      ),

      at_fault_insurer: getString(
        body.at_fault_insurer,
        raw.at_fault_insurer,
        nestedRaw.at_fault_insurer
      ),
      at_fault_policy_number: getString(
        body.at_fault_policy_number,
        raw.at_fault_policy_number,
        nestedRaw.at_fault_policy_number
      ),
      at_fault_adjuster_name: getString(
        body.at_fault_adjuster_name,
        raw.at_fault_adjuster_name,
        nestedRaw.at_fault_adjuster_name
      ),
      at_fault_adjuster_phone: getString(
        body.at_fault_adjuster_phone,
        raw.at_fault_adjuster_phone,
        nestedRaw.at_fault_adjuster_phone
      ),
      at_fault_adjuster_email: getString(
        body.at_fault_adjuster_email,
        raw.at_fault_adjuster_email,
        nestedRaw.at_fault_adjuster_email
      ),
      at_fault_claim_number: getString(
        body.at_fault_claim_number,
        raw.at_fault_claim_number,
        nestedRaw.at_fault_claim_number
      ),
      at_fault_policy_limits: getNumber(
        body.at_fault_policy_limits,
        raw.at_fault_policy_limits,
        nestedRaw.at_fault_policy_limits
      ),

      client_insurer: getString(
        body.client_insurer,
        raw.client_insurer,
        nestedRaw.client_insurer
      ),
      client_policy_number: getString(
        body.client_policy_number,
        raw.client_policy_number,
        nestedRaw.client_policy_number
      ),
      client_claim_number: getString(
        body.client_claim_number,
        raw.client_claim_number,
        nestedRaw.client_claim_number
      ),
      um_uim_limits: getNumber(
        body.um_uim_limits,
        raw.um_uim_limits,
        nestedRaw.um_uim_limits
      ),
      pip_med_pay_limits: getNumber(
        body.pip_med_pay_limits,
        raw.pip_med_pay_limits,
        nestedRaw.pip_med_pay_limits
      ),

      raw_payload: body.raw_payload ?? body,
      status: "New",
      updated_at: new Date().toISOString(),
    };

    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .insert(insertPayload)
      .select()
      .single();

    if (error || !lead) {
      return NextResponse.json(
        { error: error?.message || "Failed to create lead" },
        { status: 500 }
      );
    }

    const initialNote =
      getString(
        body.ai_summary,
        body.accident_description,
        raw.ai_summary,
        nestedRaw.ai_summary,
        raw.accident_description,
        nestedRaw.accident_description,
        raw.intake_notes,
        nestedRaw.intake_notes
      ) ?? null;

    if (initialNote) {
      const { error: noteError } = await supabaseAdmin.from("lead_notes").insert({
        lead_id: lead.id,
        author_email: "AI Intake",
        body: initialNote,
      });

      if (noteError) {
        console.error("Failed to create initial AI note:", noteError);
      }
    }

    return NextResponse.json({ success: true, lead }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}