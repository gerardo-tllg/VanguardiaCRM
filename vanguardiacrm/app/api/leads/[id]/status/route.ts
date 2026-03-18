import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type UpdateLeadStatusBody = {
  status?: "New" | "Reviewed" | "Accepted" | "Rejected" | "Archived";
};

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await req.json()) as UpdateLeadStatusBody;

    if (!id) {
      return NextResponse.json({ error: "Missing lead id" }, { status: 400 });
    }

    if (!body.status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("leads")
      .update({ status: body.status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase status update error:", error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, lead: data }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/leads/[id]/status failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}