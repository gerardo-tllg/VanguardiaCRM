import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import CaseIncidentTab from "@/app/components/CaseIncidentTab";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseIncidentPage({ params }: PageProps) {
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

const incident =
  raw.incident && typeof raw.incident === "object"
    ? (raw.incident as Record<string, unknown>)
    : {};

function getString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

const incidentData = {
  accidentDate:
    caseRecord.accident_date
      ? String(caseRecord.accident_date)
      : getString(raw.accident_date, incident.accident_date),

  incidentType:
    caseRecord.case_type ??
    getString(raw.accident_type, incident.incident_type) ??
    "",

  location:
    getString(
      caseRecord.accident_location,
      raw.accident_location,
      raw.location,
      incident.location
    ) || "—",

  clientRole:
    getString(incident.client_role) || "—",

  defendant:
    getString(
      raw.defendant,
      raw.at_fault_party,
      incident.defendant
    ) || "—",

  policeReportNumber:
    getString(
      caseRecord.police_report_number,
      raw.police_report_number,
      incident.police_report_number
    ) || "—",

  investigatingAgency:
    getString(incident.investigating_agency) || "—",

  witnessInfo:
    getString(incident.witness_info) || "—",

  conditions:
    getString(incident.conditions) || "—",

  narrative:
    getString(
      caseRecord.accident_description,
      raw.accident_description,
      raw.incident_description,
      raw.intake_notes,
      incident.narrative
    ) || "—",

  liabilityNotes:
    getString(
      caseRecord.liability_assessment,
      raw.liability_assessment,
      incident.liability_notes
    ) || "—",
};
  
}