import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import CaseClientTab from "@/app/components/CaseClientTab";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseClientPage({ params }: PageProps) {
  const { caseId } = await params;

  const { data: caseRecord, error } = await supabaseAdmin
    .from("cases")
    .select("*")
    .eq("case_number", caseId)
    .single();

  if (error || !caseRecord) {
    notFound();
  }

  const raw =
    caseRecord.raw_payload && typeof caseRecord.raw_payload === "object"
      ? (caseRecord.raw_payload as Record<string, unknown>)
      : {};

  const client =
    raw.client && typeof raw.client === "object"
      ? (raw.client as Record<string, unknown>)
      : {};

  return (
    <CaseClientTab
      caseNumber={caseRecord.case_number}
      initialData={{
        client_name: caseRecord.client_name ?? "",
        phone: caseRecord.phone ?? "",
        email: caseRecord.email ?? "",
        accident_date:
          typeof raw.accident_date === "string" ? raw.accident_date : "",
        dob: typeof client.dob === "string" ? client.dob : "",
        ssn: typeof client.ssn === "string" ? client.ssn : "",
        address_line_1:
          typeof client.address_line_1 === "string" ? client.address_line_1 : "",
        address_line_2:
          typeof client.address_line_2 === "string" ? client.address_line_2 : "",
        city: typeof client.city === "string" ? client.city : "",
        state: typeof client.state === "string" ? client.state : "",
        zip: typeof client.zip === "string" ? client.zip : "",
      }}
    />
  );
}