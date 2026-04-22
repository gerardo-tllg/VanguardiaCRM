import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ caseId: string; documentId: string }>;
};

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { caseId, documentId } = await context.params;
    const body = await req.json();

    const { data: caseRecord, error: caseError } = await supabaseAdmin
      .from("cases")
      .select("id, case_number")
      .eq("case_number", caseId)
      .single();

    if (caseError || !caseRecord) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const { data: existingDoc, error: docError } = await supabaseAdmin
      .from("case_documents")
      .select("*")
      .eq("id", documentId)
      .eq("case_id", caseRecord.id)
      .single();

    if (docError || !existingDoc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const documentType = getString(body.document_type) ?? existingDoc.document_type;
    const notes =
      typeof body.notes === "string" ? body.notes : existingDoc.notes ?? null;

    const folderId =
      body.folder_id === null || body.folder_id === ""
        ? null
        : getString(body.folder_id) ?? existingDoc.folder_id ?? null;

    const { data: updatedDoc, error: updateError } = await supabaseAdmin
      .from("case_documents")
      .update({
        document_type: documentType,
        notes,
        folder_id: folderId,
      })
      .eq("id", documentId)
      .eq("case_id", caseRecord.id)
      .select()
      .single();

    if (updateError || !updatedDoc) {
      return NextResponse.json(
        { error: updateError?.message || "Failed to update document" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, document: updatedDoc },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update document",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
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
      .select("*")
      .eq("id", documentId)
      .eq("case_id", caseRecord.id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.storage_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("case-documents")
        .remove([doc.storage_path]);

      if (storageError) {
        return NextResponse.json(
          { error: storageError.message || "Failed to delete file from storage" },
          { status: 500 }
        );
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from("case_documents")
      .delete()
      .eq("id", documentId)
      .eq("case_id", caseRecord.id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete document record" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete document",
      },
      { status: 500 }
    );
  }
}