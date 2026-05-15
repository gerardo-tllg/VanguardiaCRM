import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-user";

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser();
  if (response) return response;

  const body = await req.json();
  const { case_id, note_id, mentioned_user_ids, mentioner_name, case_number } = body;

  if (!case_id || !Array.isArray(mentioned_user_ids) || mentioned_user_ids.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const mentioner = mentioner_name || user!.email || "A team member";
  const caseRef = case_number ? `Case #${case_number}` : "a case";

  const notificationRows = mentioned_user_ids.map((uid: string) => ({
    user_id: uid,
    type: "note_mention",
    title: `${mentioner} mentioned you`,
    body: `You were mentioned in a note on ${caseRef}.`,
    case_id,
    note_id: note_id ?? null,
    read: false,
  }));

  const mentionRows = mentioned_user_ids.map((uid: string) => ({
    note_id: note_id ?? null,
    case_id,
    mentioned_user_id: uid,
  }));

  const [notifResult, mentionResult] = await Promise.all([
    supabaseAdmin.from("notifications").insert(notificationRows),
    note_id
      ? supabaseAdmin.from("note_mentions").insert(mentionRows)
      : Promise.resolve({ error: null }),
  ]);

  if (notifResult.error) {
    return NextResponse.json({ error: notifResult.error.message }, { status: 500 });
  }

  if (mentionResult.error) {
    return NextResponse.json({ error: (mentionResult as { error: { message: string } }).error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
