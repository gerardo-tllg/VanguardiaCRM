import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import StatusPipeline from "@/components/case/StatusPipeline";
import { CaseStatus } from "@/types/case";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CasePipelinePage({ params }: PageProps) {
  const { caseId } = await params;

  const { data, error } = await supabaseAdmin
    .from("cases")
    .select("id, case_status, phone, client_name")
    .eq("id", caseId)
    .single();

  if (error || !data) notFound();

  return (
    <StatusPipeline
      caseId={caseId}
      currentStatus={(data.case_status as CaseStatus) ?? "intake"}
      clientPhone={data.phone ?? undefined}
      clientName={data.client_name ?? undefined}
    />
  );
}
