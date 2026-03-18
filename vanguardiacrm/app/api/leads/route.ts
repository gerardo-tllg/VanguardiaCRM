import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    const payload = {
      client_name: body.client_name?.trim() || null,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      accident_date: body.accident_date || null,
      accident_type: body.accident_type?.trim() || null,
      injuries: body.injuries?.trim() || null,
      ai_summary: body.ai_summary ?? null,
      lang: body.lang || "en",
      utm_source: body.utm_source || "manual",
      utm_campaign: body.utm_campaign || "manual-entry",
      status: "New",
      raw_payload: body.raw_payload ?? {},
    };

    if (!payload.client_name) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    if (!payload.phone) {
      return NextResponse.json(
        { error: "Phone is required" },
        { status: 400 }
      );
    }

    if (!payload.accident_type) {
      return NextResponse.json(
        { error: "Accident type is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("leads")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("Failed to create lead:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        payload,
      });

      return NextResponse.json(
        { error: error.message || "Failed to create lead" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, lead: data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error creating lead:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}