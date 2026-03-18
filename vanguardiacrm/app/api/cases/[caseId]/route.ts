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

    const existingClient =
      existingRaw.client && typeof existingRaw.client === "object"
        ? (existingRaw.client as Record<string, unknown>)
        : {};

    const nextRaw = {
      ...existingRaw,
      accident_date: body.accident_date ?? existingRaw.accident_date ?? null,
      client: {
        ...existingClient,
        dob: body.dob ?? existingClient.dob ?? null,
        ssn: body.ssn ?? existingClient.ssn ?? null,
        address_line_1:
          body.address_line_1 ?? existingClient.address_line_1 ?? null,
        address_line_2:
          body.address_line_2 ?? existingClient.address_line_2 ?? null,
        city: body.city ?? existingClient.city ?? null,
        state: body.state ?? existingClient.state ?? null,
        zip: body.zip ?? existingClient.zip ?? null,
      },
    };

    const updatePayload = {
      client_name: body.client_name ?? existingCase.client_name,
      phone: body.phone ?? existingCase.phone,
      email: body.email ?? existingCase.email,
      raw_payload: nextRaw,
    };

    const { data: updatedRows, error: updateError } = await supabase
      .from("cases")
      .update(updatePayload)
      .eq("case_number", caseId)
      .select("id, case_number");

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to update case" },
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
        { error: refetchError?.message || "Case updated but failed to reload" },
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