import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import DefendantsTab from "@/components/case/DefendantsTab";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseDefendantsPage({ params }: PageProps) {
  const { caseId } = await params;

  const { data, error } = await supabaseAdmin
    .from("cases")
    .select("id")
    .eq("case_number", caseId)
    .single();

  if (error || !data) notFound();

  return <DefendantsTab caseId={data.id} />;
}
