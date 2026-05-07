import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import SMSInbox from "@/components/case/SMSInbox";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseSMSPage({ params }: PageProps) {
  const { caseId } = await params;

  const { data, error } = await supabaseAdmin
    .from("cases")
    .select("id, phone")
    .eq("id", caseId)
    .single();

  if (error || !data) notFound();

  return (
    <SMSInbox
      caseId={caseId}
      clientPhone={data.phone ?? ""}
    />
  );
}
