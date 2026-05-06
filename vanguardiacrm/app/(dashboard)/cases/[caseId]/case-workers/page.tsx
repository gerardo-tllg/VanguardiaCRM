import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import CaseWorkersPanel from "@/components/case/CaseWorkersPanel";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseWorkersPage({ params }: PageProps) {
  const { caseId } = await params;

  const { data, error } = await supabaseAdmin
    .from("cases")
    .select("id")
    .eq("case_number", caseId)
    .single();

  if (error || !data) notFound();

  return <CaseWorkersPanel caseId={data.id} />;
}
