import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-user";

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser();
  if (response) return response;

  const body = await req.json();
  const { caseId, noteId, noteBody, toUserId, ccUserIds } = body;

  if (!caseId) {
    return NextResponse.json({ error: "caseId is required" }, { status: 400 });
  }

  const ccList: string[] = Array.isArray(ccUserIds) ? ccUserIds : [];
  const hasRecipients = toUserId || ccList.length > 0;

  if (!hasRecipients) {
    return NextResponse.json({ ok: true });
  }

  // Look up sender profile name and case number in parallel
  const [profileResult, caseResult] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user!.id)
      .single(),
    supabaseAdmin
      .from("cases")
      .select("case_number")
      .eq("id", caseId)
      .single(),
  ]);

  const senderName =
    profileResult.data?.full_name ??
    profileResult.data?.email ??
    user!.email ??
    "A team member";

  const caseLabel = caseResult.data?.case_number
    ? `case ${caseResult.data.case_number}`
    : "a case";

  const noteSnippet =
    typeof noteBody === "string" ? noteBody.slice(0, 100) : "";

  const rows: {
    user_id: string;
    type: string;
    title: string;
    body: string;
    case_id: string;
    note_id: string | null;
    read: boolean;
  }[] = [];

  if (toUserId) {
    rows.push({
      user_id: toUserId,
      type: "note_direct",
      title: `${senderName} directed a note to you on ${caseLabel}`,
      body: noteSnippet,
      case_id: caseId,
      note_id: noteId ?? null,
      read: false,
    });
  }

  for (const uid of ccList) {
    rows.push({
      user_id: uid,
      type: "note_cc",
      title: `${senderName} CC'd you on a note for ${caseLabel}`,
      body: noteSnippet,
      case_id: caseId,
      note_id: noteId ?? null,
      read: false,
    });
  }

  const { error } = await supabaseAdmin.from("notifications").insert(rows);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
