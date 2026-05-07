import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-user";

type RouteContext = {
  params: Promise<{ caseId: string }>;
};

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { response } = await requireApiUser();
        
            if (response) {
              return response;
            }
    const { caseId } = await context.params;

    const { data: caseRecord, error: caseError } = await supabaseAdmin
      .from("cases")
      .select("id, case_number")
      .eq("id", caseId)
      .single();

    if (caseError || !caseRecord) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("document_folders")
      .select("*")
      .eq("case_id", caseRecord.id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ folders: data ?? [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const body = await req.json();

    const { data: caseRecord, error: caseError } = await supabaseAdmin
      .from("cases")
      .select("id, case_number")
      .eq("id", caseId)
      .single();

    if (caseError || !caseRecord) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const name = getString(body.name);
    const sortOrder = getNumber(body.sort_order) ?? 0;

    if (!name) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    const { data: existingFolder, error: existingError } = await supabaseAdmin
      .from("document_folders")
      .select("id")
      .eq("case_id", caseRecord.id)
      .ilike("name", name)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    if (existingFolder) {
      return NextResponse.json(
        { error: "A folder with that name already exists" },
        { status: 409 }
      );
    }

    const { data: folder, error: insertError } = await supabaseAdmin
      .from("document_folders")
      .insert({
        case_id: caseRecord.id,
        name,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (insertError || !folder) {
      return NextResponse.json(
        { error: insertError?.message || "Failed to create folder" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, folder }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create folder",
      },
      { status: 500 }
    );
  }
}