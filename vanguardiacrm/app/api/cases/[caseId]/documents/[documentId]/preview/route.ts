import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ caseId: string; documentId: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { caseId, documentId } = await context.params;

    const { data: caseRecord } = await supabaseAdmin
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .single();

    if (!caseRecord) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const { data: doc } = await supabaseAdmin
      .from("case_documents")
      .select("storage_path")
      .eq("id", documentId)
      .eq("case_id", caseRecord.id)
      .single();

    if (!doc || !doc.storage_path) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const { data } = await supabaseAdmin.storage
      .from("case-documents")
      .createSignedUrl(doc.storage_path, 60 * 5);

    return NextResponse.json({ url: data?.signedUrl });
  } catch {
    return NextResponse.json({ error: "Preview failed" }, { status: 500 });
  }
}