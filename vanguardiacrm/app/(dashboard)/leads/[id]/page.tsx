import { notFound } from "next/navigation";
import { supabaseAdmin } from "../../../../lib/supabase/server";
import LeadDetailView from "../../../components/LeadDetailView";
import type { LeadRecord } from "../../../../types/leads";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const lead = data as LeadRecord;

  return <LeadDetailView lead={lead} notes={[]} />;
}