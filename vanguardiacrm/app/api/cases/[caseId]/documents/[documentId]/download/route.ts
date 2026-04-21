import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ caseId: string; documentId: string }>;
};

function encodeFilename(name: string) {
  return encodeURIComponent(name)
    .replace(/['()]/g, escape)
    .replace(/\*/g, "%2A");
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { caseId, documentId } = await context.params;

    // ✅ FIX: use id instead of case_number
    const { data: caseRecord, error: caseError } = await supabaseAdmin
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .single();

    if (caseError || !caseRecord) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const { data: doc, error: docError } = await supabaseAdmin
      .from("case_documents")
      .select("original_filename, storage_path, mime_type")
      .eq("id", documentId)
      .eq("case_id", caseRecord.id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!doc.storage_path) {
      return NextResponse.json(
        { error: "Missing storage path" },
        { status: 400 }
      );
    }

    const { data: fileData, error: downloadError } =
      await supabaseAdmin.storage
        .from("case-documents")
        .download(doc.storage_path);

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: downloadError?.message || "Download failed" },
        { status: 500 }
      );
    }

    const buffer = await fileData.arrayBuffer();
    const filename = doc.original_filename || "document";
    const encoded = encodeFilename(filename);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": doc.mime_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encoded}`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}