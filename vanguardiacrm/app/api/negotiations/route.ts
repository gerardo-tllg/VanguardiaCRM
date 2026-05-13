import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-user";

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireApiUser();
    if (response) return response;

    const caseId = req.nextUrl.searchParams.get("case_id");
    if (!caseId) {
      return NextResponse.json({ error: "case_id is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("negotiations")
      .select("*")
      .eq("case_id", caseId)
      .order("offer_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { response } = await requireApiUser();
    if (response) return response;

    const body = await req.json();
    const { case_id, offer_date, offer_by, amount, notes } = body;

    if (!case_id || !offer_date || !offer_by || amount == null) {
      return NextResponse.json(
        { error: "case_id, offer_date, offer_by, and amount are required" },
        { status: 400 }
      );
    }

    if (!["insurance", "firm"].includes(offer_by)) {
      return NextResponse.json(
        { error: "offer_by must be 'insurance' or 'firm'" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("negotiations")
      .insert({ case_id, offer_date, offer_by, amount, notes: notes || null })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create negotiation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
