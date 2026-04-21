import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ caseId: string; documentId: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { caseId, documentId } = await context.params;

    const { data: docById, error: docByIdError } = await supabaseAdmin
      .from("case_documents")
      .select("id, case_id, storage_path, original_filename")
      .eq("id", documentId)
      .maybeSingle();

    if (docByIdError) {
      return NextResponse.json(
        { error: docByIdError.message },
        { status: 500 }
      );
    }

    if (!docById) {
      return NextResponse.json(
        {
          error: "Document not found by id",
          debug: { caseId, documentId },
        },
        { status: 404 }
      );
    }

    if (docById.case_id !== caseId) {
      return NextResponse.json(
        {
          error: "Document exists, but caseId does not match",
          debug: {
            routeCaseId: caseId,
            documentId,
            actualDocumentCaseId: docById.case_id,
            filename: docById.original_filename,
          },
        },
        { status: 400 }
      );
    }

    if (!docById.storage_path) {
      return NextResponse.json(
        { error: "Document is missing a storage path" },
        { status: 400 }
      );
    }

    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from("case-documents")
      .createSignedUrl(docById.storage_path, 60 * 5);

    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json(
        { error: signedError?.message || "Failed to generate preview URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: signedData.signedUrl,
      filename: docById.original_filename ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Preview failed",
      },
      { status: 500 }
    );
  }
}