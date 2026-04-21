import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import CaseDocumentsTab from "@/app/components/CaseDocumentsTab";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseDocumentsPage({ params }: PageProps) {
  const { caseId } = await params;

  const { data: caseRecord, error } = await supabaseAdmin
    .from("cases")
    .select("case_number")
    .eq("case_number", caseId)
    .single();

  if (error || !caseRecord) {
    notFound();
  }

  return <CaseDocumentsTab caseNumber={caseRecord.case_number} />;
};