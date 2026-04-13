import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ZapierLeadPayload = {
  source?: string;
  client_name?: string;
  full_name?: string;
  lead_name?: string;
  phone?: string;
  lead_phone?: string;
  email?: string;
  lead_email?: string;
  accident_date?: string;
  accident_type?: string;
  injuries?: string;
  ai_summary?: string;
  ai_recommendation?: string;
  lang?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  external_id?: string;
  case_id?: string;
  created_at?: string;
  timestamp?: string;
  action?: string;
  campaign_name?: string;
  adset_name?: string;
  ad_name?: string;
  form_id?: string;
  market?: string;
  medium?: string;
  raw_payload?: unknown;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function normalizeRawPayload(raw: unknown, fallback: Record<string, unknown>) {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return { raw_payload_text: raw, ...fallback };
    }
  }

  if (raw && typeof raw === "object") {
    return raw;
  }

  return fallback;
}

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-zapier-secret");

    if (!process.env.ZAPIER_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Missing ZAPIER_WEBHOOK_SECRET on server" },
        { status: 500 }
      );
    }

    if (secret !== process.env.ZAPIER_WEBHOOK_SECRET) {
      return unauthorized();
    }

    const body = (await req.json()) as ZapierLeadPayload;

    const source = body.source?.trim() || "unknown";
    const clientName =
      body.client_name?.trim() ||
      body.full_name?.trim() ||
      body.lead_name?.trim() ||
      "";
    const phone = body.phone?.trim() || body.lead_phone?.trim() || "";
    const email = body.email?.trim() || body.lead_email?.trim() || "";
    const externalId = body.external_id?.trim() || body.case_id?.trim() || "";
    const createdAt = body.created_at || body.timestamp || null;

    if (!clientName) {
      return badRequest("client_name is required");
    }

    if (!phone && !email) {
      return badRequest("Either phone or email is required");
    }


    if (externalId) {
      const { data: existingLead } = await supabaseAdmin
        .from("leads")
        .select("id")
        .eq("external_id", externalId)
        .maybeSingle();

      if (existingLead?.id) {
        return NextResponse.json(
          { success: true, leadId: existingLead.id, duplicate: true },
          { status: 200 }
        );
      }
    }

    const fallbackRawPayload = {
      source,
      client_name: clientName,
      phone,
      email,
      accident_date: body.accident_date ?? null,
      accident_type: body.accident_type ?? null,
      injuries: body.injuries ?? null,
      ai_summary: body.ai_summary ?? null,
      ai_recommendation: body.ai_recommendation ?? null,
      lang: body.lang ?? null,
      utm_source: body.utm_source ?? null,
      utm_medium: body.utm_medium ?? null,
      utm_campaign: body.utm_campaign ?? null,
      utm_term: body.utm_term ?? null,
      utm_content: body.utm_content ?? null,
      external_id: externalId || null,
      created_at: createdAt,
      action: body.action ?? null,
      campaign_name: body.campaign_name ?? null,
      adset_name: body.adset_name ?? null,
      ad_name: body.ad_name ?? null,
      form_id: body.form_id ?? null,
      market: body.market ?? null,
      medium: body.medium ?? body.utm_medium ?? null,
    };

    const leadInsert = {
      client_name: clientName,
      phone: phone || null,
      email: email || null,
      accident_date: body.accident_date || null,
      accident_type: body.accident_type?.trim() || null,
      injuries: body.injuries?.trim() || null,
      ai_summary: body.ai_summary?.trim() || null,
      lang: body.lang?.trim() || "en",
      utm_source: body.utm_source?.trim() || source,
      utm_campaign: body.utm_campaign?.trim() || null,
      status: "New",
      source,
      external_id: externalId || null,
      campaign_name: body.campaign_name?.trim() || null,
      adset_name: body.adset_name?.trim() || null,
      ad_name: body.ad_name?.trim() || null,
      form_id: body.form_id?.trim() || null,
      market: body.market?.trim() || null,
      medium: body.medium?.trim() || body.utm_medium?.trim() || null,
      raw_payload: normalizeRawPayload(body.raw_payload, fallbackRawPayload),
    };

    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .insert(leadInsert)
      .select("id")
      .single();

    if (leadError || !lead) {
      console.error("LEAD INSERT ERROR:", {
        message: leadError?.message,
        details: leadError?.details,
        hint: leadError?.hint,
        code: leadError?.code,
        leadInsert,
      });

      return NextResponse.json(
        {
          error: leadError?.message || "Failed to create lead",
          details: leadError?.details ?? null,
          hint: leadError?.hint ?? null,
          code: leadError?.code ?? null,
        },
        { status: 500 }
      );
    }

    if (body.ai_summary?.trim()) {
      await supabaseAdmin.from("lead_notes").insert({
        lead_id: lead.id,
        body: body.ai_summary.trim(),
        author_name: source === "facebook_lead_ad" ? "Facebook Lead Ad" : "AI Intake",
      });
    }

    return NextResponse.json(
      { success: true, leadId: lead.id },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}