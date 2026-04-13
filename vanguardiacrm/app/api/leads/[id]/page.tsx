import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import LeadDetailView from "../../../components/LeadDetailView";
import type { LeadRecord } from "@/types/leads";
import type { LeadNoteRecord } from "@/types/lead-notes";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [{ data: lead, error: leadError }, { data: notes, error: notesError }] =
    await Promise.all([
      supabaseAdmin.from("leads").select("*").eq("id", id).single(),
      supabaseAdmin
        .from("lead_notes")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (leadError || !lead) {
    console.error("Failed to load lead:", {
      message: leadError?.message,
      details: leadError?.details,
      hint: leadError?.hint,
      code: leadError?.code,
      leadId: id,
    });
    notFound();
  }

  if (notesError) {
    console.error("Failed to load lead notes:", {
      message: notesError.message,
      details: notesError.details,
      hint: notesError.hint,
      code: notesError.code,
      leadId: id,
    });
  }

  return (
    <LeadDetailView
      lead={lead as LeadRecord}
      notes={(notes ?? []) as LeadNoteRecord[]}
    />
  );
}