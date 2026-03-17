import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

function toCaseNumber(n: number) {
  return `case${String(n).padStart(4, "0")}`;
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const { data: existingCase, error: existingCaseError } = await supabaseAdmin
      .from("cases")
      .select("id, case_number")
      .eq("lead_id", id)
      .maybeSingle();

    if (existingCaseError) {
      return NextResponse.json(
        { error: existingCaseError.message },
        { status: 500 }
      );
    }

    if (existingCase) {
      return NextResponse.json(
        {
          success: true,
          case: existingCase,
          redirectTo: `/cases/${existingCase.case_number}/overview`,
        },
        { status: 200 }
      );
    }

    const { count, error: countError } = await supabaseAdmin
      .from("cases")
      .select("*", { count: "exact", head: true });

    if (countError) {
      return NextResponse.json(
        { error: countError.message },
        { status: 500 }
      );
    }

    const caseNumber = toCaseNumber((count ?? 0) + 1);

    const { data: newCase, error: caseError } = await supabaseAdmin
      .from("cases")
      .insert({
        lead_id: lead.id,
        case_number: caseNumber,
        client_name: lead.client_name,
        case_type: lead.accident_type ?? "Personal Injury",
        phone: lead.phone ?? null,
        email: lead.email ?? null,
        status: "Open",
        phase: "Welcome",
        assigned_to: null,
        raw_payload: lead.raw_payload ?? {},
      })
      .select()
      .single();

    if (caseError || !newCase) {
      return NextResponse.json(
        { error: caseError?.message || "Failed to create case" },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("leads")
      .update({ status: "Converted to Case" })
      .eq("id", lead.id);

    return NextResponse.json(
      {
        success: true,
        case: newCase,
        redirectTo: `/cases/${newCase.case_number}/overview`,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}