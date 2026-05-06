import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import InjuryStatusTab from "@/components/case/InjuryStatusTab";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseInjuryStatusPage({ params }: PageProps) {
  const { caseId } = await params;

  const { data, error } = await supabaseAdmin
    .from("cases")
    .select("id")
    .eq("case_number", caseId)
    .single();

  if (error || !data) notFound();

  return <InjuryStatusTab caseId={data.id} />;
}
