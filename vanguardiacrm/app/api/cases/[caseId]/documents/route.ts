import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ caseId: string }>;
};

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// GET → list documents for a case
export async function GET(_req: Request, context: RouteContext) {
  try {
    const { caseId } = await context.params;

    const { data: caseRecord, error: caseError } = await supabaseAdmin
      .from("cases")
      .select("id")
      .eq("case_number", caseId)
      .single();

    if (caseError || !caseRecord) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("case_documents")
      .select("*")
      .eq("case_id", caseRecord.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents: data ?? [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

// POST → upload document
export async function POST(req: Request, context: RouteContext) {
  try {
    const { caseId } = await context.params;

    const { data: caseRecord, error: caseError } = await supabaseAdmin
      .from("cases")
      .select("id, case_number")
      .eq("case_number", caseId)
      .single();

    if (caseError || !caseRecord) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const category =
      typeof formData.get("category") === "string"
        ? String(formData.get("category"))
        : "general";

    const notes =
      typeof formData.get("notes") === "string"
        ? String(formData.get("notes"))
        : null;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const safeName = sanitizeFileName(file.name);
    const storagePath = `${caseRecord.case_number}/${Date.now()}-${safeName}`;

    // upload to storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("case-documents")
      .upload(storagePath, fileBuffer, {
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // insert DB record
    const { data: docRow, error: insertError } = await supabaseAdmin
      .from("case_documents")
      .insert({
        case_id: caseRecord.id,
        original_filename: file.name,
        storage_path: storagePath,
        mime_type: file.type || null,
        size_bytes: file.size,
        category,
        notes,
      })
      .select()
      .single();

    if (insertError || !docRow) {
      return NextResponse.json(
        { error: insertError?.message || "Failed to save document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, document: docRow }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}