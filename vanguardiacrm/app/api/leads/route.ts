import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateLeadBody;

    if (!body.client_name?.trim()) {
      return NextResponse.json(
        { error: "client_name is required" },
        { status: 400 }
      );
    }

    const insertPayload = {
      client_name: body.client_name.trim(),
      phone: body.phone ?? null,
      email: body.email ?? null,
      accident_date: body.accident_date ?? null,
      accident_type: body.accident_type ?? null,
      injuries: body.injuries ?? null,
      ai_summary: body.ai_summary ?? null,
      lang: body.lang ?? null,
      utm_source: body.utm_source ?? "manual",
      utm_campaign: body.utm_campaign ?? "manual-entry",
      raw_payload: body.raw_payload ?? body,
      status: "New",
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

    if (body.ai_summary?.trim()) {
      const { error: noteError } = await supabaseAdmin.from("lead_notes").insert({
        lead_id: lead.id,
        author_email: "AI Intake",
        body: body.ai_summary.trim(),
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