import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ caseId: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const body = await req.json();
    const supabase = await createClient();

    const { data: existingCase, error: fetchError } = await supabase
      .from("cases")
      .select("*")
      .eq("case_number", caseId)
      .single();

    if (fetchError || !existingCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const existingRaw =
      existingCase.raw_payload && typeof existingCase.raw_payload === "object"
        ? (existingCase.raw_payload as Record<string, unknown>)
        : {};

    const existingIncident =
      existingRaw.incident && typeof existingRaw.incident === "object"
        ? (existingRaw.incident as Record<string, unknown>)
        : {};

    const nextRaw = {
      ...existingRaw,
      accident_date: body.accident_date ?? existingRaw.accident_date ?? null,
      incident: {
        ...existingIncident,
        incident_time: body.incident_time ?? existingIncident.incident_time ?? null,
        incident_type: body.incident_type ?? existingIncident.incident_type ?? null,
        location: body.location ?? existingIncident.location ?? null,
        city: body.city ?? existingIncident.city ?? null,
        state: body.state ?? existingIncident.state ?? null,
        client_role: body.client_role ?? existingIncident.client_role ?? null,
        defendant: body.defendant ?? existingIncident.defendant ?? null,
        police_report_number:
          body.police_report_number ??
          existingIncident.police_report_number ??
          null,
        investigating_agency:
          body.investigating_agency ??
          existingIncident.investigating_agency ??
          null,
        witness_info: body.witness_info ?? existingIncident.witness_info ?? null,
        conditions: body.conditions ?? existingIncident.conditions ?? null,
        narrative: body.narrative ?? existingIncident.narrative ?? null,
        liability_notes:
          body.liability_notes ?? existingIncident.liability_notes ?? null,
      },
    };

    const updatePayload = {
      case_type: body.incident_type ?? existingCase.case_type,
      raw_payload: nextRaw,
    };

    const { data: updatedRows, error: updateError } = await supabase
      .from("cases")
      .update(updatePayload)
      .eq("case_number", caseId)
      .select("id, case_number");

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to update incident" },
        { status: 500 }
      );
    }

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        {
          error:
            "No case row was updated. This is usually caused by RLS update policy restrictions.",
        },
        { status: 403 }
      );
    }

    const { data: updatedCase, error: refetchError } = await supabase
      .from("cases")
      .select("*")
      .eq("case_number", caseId)
      .single();

    if (refetchError || !updatedCase) {
      return NextResponse.json(
        { error: refetchError?.message || "Incident updated but failed to reload" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, case: updatedCase },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}