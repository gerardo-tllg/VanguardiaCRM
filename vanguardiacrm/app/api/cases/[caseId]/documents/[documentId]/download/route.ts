import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ caseId: string; documentId: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { caseId, documentId } = await context.params;

    const { data: caseRecord, error: caseError } = await supabaseAdmin
      .from("cases")
      .select("id, case_number")
      .eq("case_number", caseId)
      .single();

    if (caseError || !caseRecord) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const { data: doc, error: docError } = await supabaseAdmin
      .from("case_documents")
      .select("id, case_id, original_filename, storage_path")
      .eq("id", documentId)
      .eq("case_id", caseRecord.id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!doc.storage_path) {
      return NextResponse.json(
        { error: "Document has no storage path" },
        { status: 400 }
      );
    }

    const { data: signed, error: signedUrlError } = await supabaseAdmin.storage
      .from("case-documents")
      .createSignedUrl(doc.storage_path, 60 * 5);

    if (signedUrlError || !signed?.signedUrl) {
      return NextResponse.json(
        { error: signedUrlError?.message || "Failed to create signed URL" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        url: signed.signedUrl,
        filename: doc.original_filename,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate download URL",
      },
      { status: 500 }
    );
  }
}