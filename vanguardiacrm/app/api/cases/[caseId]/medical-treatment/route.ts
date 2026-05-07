import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-user";

type RouteContext = {
  params: Promise<{ caseId: string }>;
};

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

    const existingRaw =
      existingCase.raw_payload && typeof existingCase.raw_payload === "object"
        ? (existingCase.raw_payload as Record<string, unknown>)
        : {};

    const existingMedical =
      existingRaw.medical && typeof existingRaw.medical === "object"
        ? (existingRaw.medical as Record<string, unknown>)
        : {};

    const nextRaw = {
      ...existingRaw,
      medical: {
        ...existingMedical,
        first_treatment_date:
          body.first_treatment_date ??
          existingMedical.first_treatment_date ??
          null,
        last_treatment_date:
          body.last_treatment_date ?? existingMedical.last_treatment_date ?? null,
        currently_treating:
          body.currently_treating ?? existingMedical.currently_treating ?? null,
        gap_in_treatment:
          body.gap_in_treatment ?? existingMedical.gap_in_treatment ?? null,
        primary_injuries_summary:
          body.primary_injuries_summary ??
          existingMedical.primary_injuries_summary ??
          null,
        surgery_recommended:
          body.surgery_recommended ??
          existingMedical.surgery_recommended ??
          null,
        surgery_details:
          body.surgery_details ?? existingMedical.surgery_details ?? null,
        providers: body.providers ?? existingMedical.providers ?? null,
        records_requested_date:
          body.records_requested_date ??
          existingMedical.records_requested_date ??
          null,
        records_received_date:
          body.records_received_date ??
          existingMedical.records_received_date ??
          null,
        bills_requested_date:
          body.bills_requested_date ??
          existingMedical.bills_requested_date ??
          null,
        bills_received_date:
          body.bills_received_date ??
          existingMedical.bills_received_date ??
          null,
        lien_notes: body.lien_notes ?? existingMedical.lien_notes ?? null,
        insurance_notes:
          body.insurance_notes ?? existingMedical.insurance_notes ?? null,
      },
    };

    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from("cases")
      .update({
        raw_payload: nextRaw,
      })
      .eq("id", caseId)
      .select("id, case_number");

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to update medical treatment" },
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

    const { data: updatedCase, error: refetchError } = await supabaseAdmin
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .single();

    if (refetchError || !updatedCase) {
      return NextResponse.json(
        {
          error:
            refetchError?.message ||
            "Medical treatment updated but failed to reload",
        },
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