import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ZapierLeadPayload = {
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
  [key: string]: unknown;
};

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as ZapierLeadPayload;

    if (!payload.client_name) {
      return NextResponse.json(
        { error: "client_name is required" },
        { status: 400 }
      );
    }
    const supabase = await createClient();
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        client_name: payload.client_name,
        phone: payload.phone ?? null,
        email: payload.email ?? null,
        accident_date: payload.accident_date ?? null,
        accident_type: payload.accident_type ?? null,
        injuries: payload.injuries ?? null,
        ai_summary: payload.ai_summary ?? null,
        lang: payload.lang ?? null,
        utm_source: payload.utm_source ?? null,
        utm_campaign: payload.utm_campaign ?? null,
        raw_payload: payload,
        status: "New",
      })
      .select()
      .single();

    if (leadError) {
      console.error("Supabase insert error:", leadError);
      return NextResponse.json(
        { error: "Failed to create lead" },
        { status: 500 }
      );
    }

    if (payload.ai_summary && lead?.id) {
      const { error: noteError } = await supabase.from("lead_notes").insert({
        lead_id: lead.id,
        author_email: "AI Intake System",
        body: payload.ai_summary,
      });

      if (noteError) {
        console.error("Failed to create AI summary note:", noteError);
      }
    }

    return NextResponse.json({ success: true, lead }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 }
    );
  }
}