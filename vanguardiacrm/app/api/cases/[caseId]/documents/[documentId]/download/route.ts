import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-user";

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
    const { response } = await requireApiUser();

    if (response) {
      return response;
    }

    const { caseId, documentId } = await context.params;

    const { data: caseRecord, error: caseError } = await supabaseAdmin
      .from("cases")
      .select("id, case_number")
      .eq("id", caseId)
      .single();

    if (caseError || !caseRecord) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const { data: doc, error: docError } = await supabaseAdmin
      .from("case_documents")
      .select("id, case_id, original_filename, storage_path, mime_type")
      .eq("id", documentId)
      .eq("case_id", caseRecord.id)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Document not found for this case" },
        { status: 404 }
      );
    }

    if (!doc.storage_path) {
      return NextResponse.json(
        { error: "Document is missing a storage path" },
        { status: 400 }
      );
    }

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("case-documents")
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: downloadError?.message || "Failed to download file" },
        { status: 500 }
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const filename = doc.original_filename || "document";
    const encoded = encodeFilename(filename);

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": doc.mime_type || "application/octet-stream",
        "Content-Length": String(arrayBuffer.byteLength),
        "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"; filename*=UTF-8''${encoded}`,
        "Cache-Control": "private, no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Download failed",
      },
      { status: 500 }
    );
  }
}