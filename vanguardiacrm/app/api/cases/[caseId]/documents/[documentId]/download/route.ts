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
      .select("*")
      .eq("id", documentId)
      .eq("case_id", caseRecord.id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin.storage
      .from("case-documents")
      .createSignedUrl(doc.storage_path, 60 * 10);

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: error?.message || "Failed to create download link" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.signedUrl }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Download failed" },
      { status: 500 }
    );
  }
}