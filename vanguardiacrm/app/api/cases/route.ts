import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-user";
function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildCaseNumber() {
  return Date.now().toString();
}

export async function POST(req: NextRequest) {
  try {
    const { response } = await requireApiUser();
                
                    if (response) {
                      return response;
                    }
    const body = await req.json();

    const clientName = normalizeString(body.client_name);
    const phone = normalizeString(body.phone);
    const email = normalizeString(body.email);
    const caseType = normalizeString(body.case_type) ?? "Personal Injury";
    const status = normalizeString(body.status) ?? "Welcome!";
    const assignedTo = normalizeString(body.assigned_to) ?? "Admin";
    const accidentDate = normalizeString(body.accident_date);

    const rawPayload =
      body.raw_payload && typeof body.raw_payload === "object"
        ? body.raw_payload
        : {};

    if (!clientName) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Phone is required" },
        { status: 400 }
      );
    }

    const caseNumber = buildCaseNumber();

    const { data, error } = await supabaseAdmin
      .from("cases")
      .insert({
        case_number: caseNumber,
        client_name: clientName,
        phone,
        email,
        case_type: caseType,
        status,
        assigned_to: assignedTo,
        accident_date: accidentDate,
        raw_payload: rawPayload,
        source_channel: "manual",
        source_medium: "internal",
        source_campaign: "manual-intake",
      })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Failed to create case" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, case: data },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create case",
      },
      { status: 500 }
    );
  }
}