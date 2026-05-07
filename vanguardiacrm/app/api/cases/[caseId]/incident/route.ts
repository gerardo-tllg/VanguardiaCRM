import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-user";
type RouteContext = {
  params: Promise<{ caseId: string }>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { response } = await requireApiUser();
            
                if (response) {
                  return response;
                }
    const { caseId } = await context.params;
    const body = await req.json();

    const { data: existingCase, error: fetchError } = await supabaseAdmin
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .single();

    if (fetchError || !existingCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const existingRaw = asRecord(existingCase.raw_payload);
    const existingIncident = asRecord(existingRaw.incident);

    const nextIncident = {
      ...existingIncident,
      incident_time: body.incident_time ?? existingIncident.incident_time ?? null,
      incident_type: body.incident_type ?? existingIncident.incident_type ?? null,
      location: body.location ?? existingIncident.location ?? null,
      city: body.city ?? existingIncident.city ?? null,
      state: body.state ?? existingIncident.state ?? null,
      client_role: body.client_role ?? existingIncident.client_role ?? null,
      defendant: body.defendant ?? existingIncident.defendant ?? null,
      police_report_number:
        body.police_report_number ?? existingIncident.police_report_number ?? null,
      investigating_agency:
        body.investigating_agency ?? existingIncident.investigating_agency ?? null,
      witness_info: body.witness_info ?? existingIncident.witness_info ?? null,
      conditions: body.conditions ?? existingIncident.conditions ?? null,
      narrative: body.narrative ?? existingIncident.narrative ?? null,
      liability_notes:
        body.liability_notes ?? existingIncident.liability_notes ?? null,
    };

    const combinedLocation = [body.location, body.city, body.state]
      .filter((part: unknown) => typeof part === "string" && part.trim())
      .join(", ");

    const nextRaw = {
      ...existingRaw,
      accident_date: body.accident_date ?? existingRaw.accident_date ?? null,
      accident_type: body.incident_type ?? existingRaw.accident_type ?? null,
      accident_location:
        combinedLocation || existingRaw.accident_location || null,
      accident_description:
        body.narrative ?? existingRaw.accident_description ?? null,
      police_report_number:
        body.police_report_number ?? existingRaw.police_report_number ?? null,
      liability_assessment:
        body.liability_notes ?? existingRaw.liability_assessment ?? null,
      defendant: body.defendant ?? existingRaw.defendant ?? null,
      incident: nextIncident,
    };

    const updatePayload = {
      case_type: getString(body.incident_type) ?? existingCase.case_type,
      accident_date: getString(body.accident_date) ?? existingCase.accident_date,
      accident_location:
        combinedLocation || existingCase.accident_location || null,
      accident_description:
        getString(body.narrative) ?? existingCase.accident_description,
      police_report_number:
        getString(body.police_report_number) ?? existingCase.police_report_number,
      liability_assessment:
        getString(body.liability_notes) ?? existingCase.liability_assessment,
      raw_payload: nextRaw,
      updated_at: new Date().toISOString(),
      incident_time: getString(body.incident_time) ?? existingCase.incident_time,
      client_role: getString(body.client_role) ?? existingCase.client_role,
      defendant: getString(body.defendant) ?? existingCase.defendant,
      investigating_agency:
        getString(body.investigating_agency) ?? existingCase.investigating_agency,
      witness_info: getString(body.witness_info) ?? existingCase.witness_info,
      conditions: getString(body.conditions) ?? existingCase.conditions,
    };

    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from("cases")
      .update(updatePayload)
      .eq("id", caseId)
      .select("id, case_number");

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to update incident" },
        { status: 500 }
      );
    }

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        { error: "No case row was updated." },
        { status: 404 }
      );
    }

    const { data: updatedCase, error: refetchError } = await supabaseAdmin
      .from("cases")
      .select("*")
      .eq("id", caseId)
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