import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-user";

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
  raw_payload?: Record<string, unknown> | null;
  status?: string | null;
};

function normalizeLeadStatus(value: string | null | undefined) {
  if (!value) return "New";

  const normalized = value.toLowerCase().trim();

  const map: Record<string, string> = {
    new: "New",
    "new lead": "New",
    incoming: "New",

    contacted: "Contacted",
    called: "Contacted",
    "follow up": "Contacted",
    follow_up: "Contacted",

    qualified: "Qualified",
    good: "Qualified",

    converted: "Converted",
    "converted to case": "Converted",
    "case created": "Converted",

    rejected: "Rejected",
    bad: "Rejected",
    "not a case": "Rejected",
  };

  return map[normalized] ?? "New";
}

function normalizeString(value: string | null | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(req: Request) {
  try {
    const { response } = await requireApiUser();

    if (response) {
      return response;
    }

    const body = (await req.json()) as CreateLeadBody;

    const clientName = normalizeString(body.client_name);

    if (!clientName) {
      return NextResponse.json(
        { error: "client_name is required" },
        { status: 400 }
      );
    }

    const insertPayload = {
      client_name: clientName,
      phone: normalizeString(body.phone),
      email: normalizeString(body.email),
      accident_date: normalizeString(body.accident_date),
      accident_type: normalizeString(body.accident_type),
      injuries: normalizeString(body.injuries),
      ai_summary: normalizeString(body.ai_summary),
      lang: normalizeString(body.lang) ?? "en",
      utm_source: normalizeString(body.utm_source) ?? "manual",
      utm_campaign: normalizeString(body.utm_campaign) ?? "manual-entry",
      raw_payload: body.raw_payload ?? body,
      status: normalizeLeadStatus(body.status),
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

    if (insertPayload.ai_summary) {
      const { error: noteError } = await supabaseAdmin.from("lead_notes").insert({
        lead_id: lead.id,
        author_email: "AI Intake",
        body: insertPayload.ai_summary,
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
