import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

type CreateLeadBody = {
  client_name?: string;
  phone?: string;
  email?: string;
  accident_date?: string;
  accident_type?: string;
  injuries?: string;
  ai_summary?: string;
  lang?: string;
  utm_source?: string;
  utm_campaign?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateLeadBody;

    if (!body.client_name) {
      return NextResponse.json(
        { error: "client_name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert({
        client_name: body.client_name,
        phone: body.phone ?? null,
        email: body.email ?? null,
        accident_date: body.accident_date ?? null,
        accident_type: body.accident_type ?? null,
        injuries: body.injuries ?? null,
        ai_summary: body.ai_summary ?? null,
        lang: body.lang ?? null,
        utm_source: body.utm_source ?? "manual",
        utm_campaign: body.utm_campaign ?? "manual-entry",
        raw_payload: body,
        status: "New",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create lead:", error);
      return NextResponse.json(
        { error: "Failed to create lead" },
        { status: 500 }
      );
    }

    if (body.ai_summary && data?.id) {
      await supabaseAdmin.from("lead_notes").insert({
        lead_id: data.id,
        author_email: "Manual Intake",
        body: body.ai_summary,
      });
    }

    return NextResponse.json({ success: true, lead: data }, { status: 200 });
  } catch (error) {
    console.error("POST /api/leads failed:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}