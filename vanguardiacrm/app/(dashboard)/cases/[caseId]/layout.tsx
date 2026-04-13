export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import CaseHeader from "../../../components/CaseHeader";
import CaseTabs from "../../../components/CaseTabs";
import CaseNotesPanel from "../../../components/CaseNotesPanel";
import { supabaseAdmin } from "@/lib/supabase/admin";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ caseId: string }>;
};

export default async function CaseLayout({
  children,
  params,
}: LayoutProps) {
  const { caseId } = await params;

  const { data: caseRecord, error: caseError } = await supabaseAdmin
    .from("cases")
    .select("*")
    .eq("case_number", caseId)
    .single();

  if (caseError || !caseRecord) {
    console.error("Failed to load case:", {
      message: caseError?.message,
      details: caseError?.details,
      hint: caseError?.hint,
      code: caseError?.code,
      caseId,
    });
    notFound();
  }

  const { data: notes, error: notesError } = await supabaseAdmin
    .from("case_notes")
    .select("*")
    .eq("case_id", caseRecord.id)
    .order("created_at", { ascending: false });

  if (notesError) {
    console.error("Failed to load case notes:", {
      message: notesError.message,
      details: notesError.details,
      hint: notesError.hint,
      code: notesError.code,
      routeCaseId: caseId,
      caseNumber: caseRecord.case_number,
      casePrimaryKey: caseRecord.id,
    });
  }

  const raw =
    caseRecord.raw_payload && typeof caseRecord.raw_payload === "object"
      ? (caseRecord.raw_payload as Record<string, unknown>)
      : {};

  const caseData = {
    id: caseRecord.case_number,
    clientName: caseRecord.client_name ?? "Unknown Client",
    dateOfIncident:
      typeof raw.accident_date === "string" && raw.accident_date
        ? raw.accident_date
        : "Not provided",
    caseType: caseRecord.case_type ?? "Personal Injury",
    status: caseRecord.status ?? "Open",
    phone: caseRecord.phone ?? "N/A",
    email: caseRecord.email ?? "N/A",
    assignedTo: caseRecord.assigned_to ?? "Unassigned",
    office:
      typeof raw.office === "string" && raw.office ? raw.office : "TX",
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <CaseHeader caseData={caseData} />
      <CaseTabs caseNumber={caseRecord.case_number} />

      <div className="flex flex-1 gap-6 p-6">
        <main className="min-w-0 flex-1">{children}</main>
        <CaseNotesPanel caseId={caseRecord.id} initialNotes={notes ?? []} />
      </div>
    </div>
  );
}