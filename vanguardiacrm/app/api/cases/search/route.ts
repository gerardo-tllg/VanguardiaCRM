import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-user";

export async function GET(req: Request) {
  const { response } = await requireApiUser();

  if (response) {
    return response;
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ cases: [] });
  }

  const { data, error } = await supabaseAdmin
    .from("cases")
    .select("case_number, client_name")
    .or(
      `client_name.ilike.%${q}%,case_number.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`
    )
    .limit(10);

  if (error) {
    return NextResponse.json({ cases: [] });
  }

  return NextResponse.json({ cases: data || [] });
}