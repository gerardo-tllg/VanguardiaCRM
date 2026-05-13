import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-user";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { response } = await requireApiUser();
    if (response) return response;

    const { id } = await context.params;
    const body = await req.json();
    const { offer_date, offer_by, amount, notes } = body;

    const update: Record<string, unknown> = {};
    if (offer_date != null) update.offer_date = offer_date;
    if (offer_by != null) update.offer_by = offer_by;
    if (amount != null) update.amount = amount;
    if ("notes" in body) update.notes = notes || null;

    const { data, error } = await supabaseAdmin
      .from("negotiations")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to update negotiation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { response } = await requireApiUser();
    if (response) return response;

    const { id } = await context.params;

    const { error } = await supabaseAdmin
      .from("negotiations")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
