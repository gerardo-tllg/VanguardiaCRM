import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-user";

export async function GET() {
  const { user, response } = await requireApiUser();
  if (response) return response;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data ?? null });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser();
  if (response) return response;

  const body = await req.json();
  const { full_name, email, role } = body;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: user!.id,
        full_name: full_name ?? null,
        email: email ?? user!.email ?? null,
        role: role ?? "staff",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
