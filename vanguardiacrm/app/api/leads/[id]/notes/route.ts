import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type CreateLeadNoteBody = {
  body?: string;
  author_email?: string;
};

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const payload = (await req.json()) as CreateLeadNoteBody;

    if (!id) {
      return NextResponse.json({ error: "Missing lead id" }, { status: 400 });
    }

    const noteBody = payload.body?.trim();

    if (!noteBody) {
      return NextResponse.json(
        { error: "Note body is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("lead_notes")
      .insert({
        lead_id: id,
        author_email: payload.author_email ?? "Staff",
        body: noteBody,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create lead note:", error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, note: data }, { status: 200 });
  } catch (error) {
    console.error("POST /api/leads/[id]/notes failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}