import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ caseId: string; documentId: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { caseId, documentId } = await context.params;

    const { data: doc, error: docError } = await supabaseAdmin
      .from("case_documents")
      .select("id, case_id, storage_path, original_filename")
      .eq("id", documentId)
      .eq("case_id", caseId)
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

    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from("case-documents")
      .createSignedUrl(doc.storage_path, 60 * 5);

    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json(
        { error: signedError?.message || "Failed to generate preview URL" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        url: signedData.signedUrl,
        filename: doc.original_filename ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Preview failed",
      },
      { status: 500 }
    );
  }
}