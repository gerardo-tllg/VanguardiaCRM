import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CaseIncidentTab from "@/app/components/CaseIncidentTab";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseIncidentPage({ params }: PageProps) {
  const { caseId } = await params;
  const supabase = await createClient();

  const { data: caseRecord, error } = await supabase
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

  const incident =
    raw.incident && typeof raw.incident === "object"
      ? (raw.incident as Record<string, unknown>)
      : {};

  return (
    <CaseIncidentTab
      caseNumber={caseRecord.case_number}
      initialData={{
        accident_date:
          typeof raw.accident_date === "string" ? raw.accident_date : "",
        incident_time:
          typeof incident.incident_time === "string" ? incident.incident_time : "",
        incident_type:
          typeof incident.incident_type === "string"
            ? incident.incident_type
            : caseRecord.case_type ?? "",
        location:
          typeof incident.location === "string" ? incident.location : "",
        city: typeof incident.city === "string" ? incident.city : "",
        state: typeof incident.state === "string" ? incident.state : "",
        client_role:
          typeof incident.client_role === "string" ? incident.client_role : "",
        defendant:
          typeof incident.defendant === "string" ? incident.defendant : "",
        police_report_number:
          typeof incident.police_report_number === "string"
            ? incident.police_report_number
            : "",
        investigating_agency:
          typeof incident.investigating_agency === "string"
            ? incident.investigating_agency
            : "",
        witness_info:
          typeof incident.witness_info === "string" ? incident.witness_info : "",
        conditions:
          typeof incident.conditions === "string" ? incident.conditions : "",
        narrative:
          typeof incident.narrative === "string" ? incident.narrative : "",
        liability_notes:
          typeof incident.liability_notes === "string"
            ? incident.liability_notes
            : "",
      }}
    />
  );
}