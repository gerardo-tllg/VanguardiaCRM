import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import CaseIncidentTab from "@/app/components/CaseIncidentTab";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function splitLocationParts(location: string) {
  if (!location.trim()) {
    return {
      location: "",
      city: "",
      state: "",
    };
  }

  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);

  if (parts.length >= 3) {
    return {
      location: parts[0],
      city: parts[1],
      state: parts.slice(2).join(", "),
    };
  }

  if (parts.length === 2) {
    return {
      location: parts[0],
      city: parts[1],
      state: "",
    };
  }

  return {
    location,
    city: "",
    state: "",
  };
}

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

  const nested =
    raw.raw_payload && typeof raw.raw_payload === "object"
      ? (raw.raw_payload as Record<string, unknown>)
      : {};

  const incident =
    raw.incident && typeof raw.incident === "object"
      ? (raw.incident as Record<string, unknown>)
      : {};

  const resolvedLocation =
    getString(
      caseRecord.accident_location,
      raw.accident_location,
      nested.accident_location,
      raw.location,
      nested.location,
      incident.location
    ) || "";

  const locationParts = splitLocationParts(resolvedLocation);

  const initialData = {
    accident_date: caseRecord.accident_date
      ? String(caseRecord.accident_date)
      : getString(raw.accident_date, nested.accident_date, incident.accident_date),

    incident_time: getString(
      incident.incident_time,
      raw.incident_time,
      nested.incident_time
    ),

    incident_type:
      getString(
        caseRecord.case_type,
        raw.accident_type,
        nested.accident_type,
        incident.incident_type
      ) || "",

    location: locationParts.location,
    city: locationParts.city,
    state: locationParts.state,

    client_role: getString(
      incident.client_role,
      raw.client_role,
      nested.client_role
    ),

    defendant: getString(
      raw.defendant,
      nested.defendant,
      raw.at_fault_party,
      nested.at_fault_party,
      incident.defendant
    ),

    police_report_number: getString(
      caseRecord.police_report_number,
      raw.police_report_number,
      nested.police_report_number,
      incident.police_report_number
    ),

    investigating_agency: getString(
      incident.investigating_agency,
      raw.investigating_agency,
      nested.investigating_agency
    ),

    witness_info: getString(
      incident.witness_info,
      raw.witness_info,
      nested.witness_info
    ),

    conditions: getString(
      incident.conditions,
      raw.conditions,
      nested.conditions
    ),

    narrative: getString(
      caseRecord.accident_description,
      raw.accident_description,
      nested.accident_description,
      raw.incident_description,
      nested.incident_description,
      raw.intake_notes,
      nested.intake_notes,
      incident.narrative
    ),

    liability_notes: getString(
      caseRecord.liability_assessment,
      raw.liability_assessment,
      nested.liability_assessment,
      incident.liability_notes
    ),
  };

  return (
    <CaseIncidentTab
      caseNumber={caseRecord.case_number}
      initialData={initialData}
    />
  );
}