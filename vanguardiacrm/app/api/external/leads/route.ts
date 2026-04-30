import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const digits = value.replace(/\D/g, "");
  return digits || null;
}

// 🔍 OPTIONAL: helps debug if route is being hit
export async function GET() {
  return NextResponse.json(
    { message: "External leads endpoint is live" },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  try {
    // 🔐 API KEY AUTH
    const authHeader = req.headers.get("authorization");
    const expectedKey = process.env.ACCIDENTINTEL_API_KEY;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!expectedKey || token !== expectedKey) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // 🧾 VALIDATION
    const clientName = normalizeString(body.client_name);
    const phone = normalizePhone(body.phone);
    const email = normalizeString(body.email);
    const accidentDate = normalizeString(body.accident_date);
    const accidentType =
      normalizeString(body.accident_type) ?? "Motor Vehicle Accident";

    if (!clientName) {
      return NextResponse.json(
        { error: "client_name is required" },
        { status: 400 }
      );
    }

    if (!phone && !email) {
      return NextResponse.json(
        { error: "phone or email is required" },
        { status: 400 }
      );
    }

    if (!accidentDate) {
      return NextResponse.json(
        { error: "accident_date is required" },
        { status: 400 }
      );
    }

    // 📦 PAYLOAD
    const insertPayload = {
      client_name: clientName,
      phone,
      email,
      accident_date: accidentDate,
      accident_type: accidentType,

      screening_score:
        typeof body.screening_score === "number"
          ? body.screening_score
          : null,

      accident_location: normalizeString(body.accident_location),
      accident_description: normalizeString(body.accident_description),

      source_channel: "accidentintel",
      source_medium: "api",
      source_campaign:
        normalizeString(body.source_campaign) ?? "accidentintel-live",

      status: "New",
      raw_payload: body,
    };

    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .insert(insertPayload)
      .select()
      .single();

    if (error || !lead) {
      return NextResponse.json(
        {
          error: error?.message || "Failed to create lead",
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, lead },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid request",
      },
      { status: 400 }
    );
  }
}