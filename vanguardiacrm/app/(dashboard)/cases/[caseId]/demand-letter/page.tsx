import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import DemandLetterTab from "@/components/case/DemandLetterTab";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseDemandLetterPage({ params }: PageProps) {
  const { caseId } = await params;

  const { data, error } = await supabaseAdmin
    .from("cases")
    .select("id")
    .eq("case_number", caseId)
    .single();

  if (error || !data) notFound();

  return <DemandLetterTab caseId={data.id} />;
}
