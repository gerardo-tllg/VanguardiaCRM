import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-user";

type RouteContext = {
  params: Promise<{ caseId: string }>;
};

const VALID_PHASES = [
  "Welcome",
  "Treatment Phase",
  "Demand Prep",
  "Demand Sent",
  "Negotiation",
  "Settlement",
  "Closed",
];

function normalizePhase(value: unknown) {
  if (typeof value !== "string") return null;

  const phase = value.trim();

  return VALID_PHASES.includes(phase) ? phase : null;
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { response } = await requireApiUser();

    if (response) {
      return response;
    }

    const { caseId } = await context.params;
    const body = await req.json();

    const phase = normalizePhase(body.phase);

    if (!phase) {
      return NextResponse.json(
        { error: "Invalid phase" },
        { status: 400 }
      );
    }

    const updatePayload = {
      phase,
      status: phase === "Closed" ? "Closed" : "Open",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("cases")
      .update(updatePayload)
      .eq("case_number", caseId)
      .select("id, case_number, status, phase")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Case not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, case: data },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}