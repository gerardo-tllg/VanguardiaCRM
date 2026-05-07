import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-user";

type RouteContext = {
  params: Promise<{ caseId: string; folderId: string }>;
};

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { response } = await requireApiUser();
        
            if (response) {
              return response;
            }
    const { caseId, folderId } = await context.params;

    const { data: caseRecord, error: caseError } = await supabaseAdmin
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .single();

    if (caseError || !caseRecord) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const { data: folder, error: folderError } = await supabaseAdmin
      .from("document_folders")
      .select("id, case_id")
      .eq("id", folderId)
      .eq("case_id", caseRecord.id)
      .single();

    if (folderError || !folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const { error: unfileError } = await supabaseAdmin
      .from("case_documents")
      .update({ folder_id: null })
      .eq("case_id", caseRecord.id)
      .eq("folder_id", folderId);

    if (unfileError) {
      return NextResponse.json(
        { error: unfileError.message || "Failed to remove files from folder" },
        { status: 500 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("document_folders")
      .delete()
      .eq("id", folderId)
      .eq("case_id", caseRecord.id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete folder" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete folder" },
      { status: 500 }
    );
  }
}
