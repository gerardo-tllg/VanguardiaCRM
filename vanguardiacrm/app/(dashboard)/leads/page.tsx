export const dynamic = "force-dynamic";

import LeadsWorkspace from "../../components/LeadsWorkspace";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { LeadRecord } from "../../../types/leads";

type SourceCaseRecord = {
  id: string;
  case_type: string | null;
  phone: string | null;
  email: string | null;
  client_language: string | null;
  accident_date: string | null;
  accident_location: string | null;
  accident_description: string | null;
  screening_score: string | null;
  estimated_case_value: string | null;
  liability_assessment: string | null;
  injury_severity: string | null;
  ai_screening_notes: string | null;
};

function formatCentralTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getNestedRawPayload(rawPayload: unknown) {
  const top = asRecord(rawPayload);
  const nested = asRecord(top.raw_payload);

  return { top, nested };
}

function getString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function getNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function parseInjuries(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return asRecord(parsed);
  } catch {
    return {};
  }
}

function scoreToPriority(score: number): "Low" | "Medium" | "High" {
  if (score >= 80) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

export default async function LeadsPage() {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load leads:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  const leads: LeadRecord[] = data ?? [];

  const migratedCaseIds = leads
    .map((lead) => {
      const top = asRecord(lead.raw_payload);
      const id = top.migrated_from_case_id;
      return typeof id === "string" && id.trim() ? id : null;
    })
    .filter((value): value is string => Boolean(value));

  const uniqueMigratedCaseIds = [...new Set(migratedCaseIds)];

  let sourceCaseMap = new Map<string, SourceCaseRecord>();

  if (uniqueMigratedCaseIds.length > 0) {
    const { data: sourceCases, error: sourceCasesError } = await supabaseAdmin
      .from("cases")
      .select(
        [
          "id",
          "case_type",
          "phone",
          "email",
          "client_language",
          "accident_date",
          "accident_location",
          "accident_description",
          "screening_score",
          "estimated_case_value",
          "liability_assessment",
          "injury_severity",
          "ai_screening_notes",
        ].join(",")
      )
      .in("id", uniqueMigratedCaseIds);

    if (sourceCasesError) {
      console.error("Failed to load source cases for migrated leads:", {
        message: sourceCasesError.message,
        details: sourceCasesError.details,
        hint: sourceCasesError.hint,
        code: sourceCasesError.code,
      });
    } else {
      sourceCaseMap = new Map(
        ((sourceCases ?? []) as unknown as SourceCaseRecord[]).map((row) => [row.id, row])
      );
    }
  }

  const normalizedLeads = leads.map((lead) => {
    const { top, nested } = getNestedRawPayload(lead.raw_payload);

    const migratedFromCaseId = getString(top.migrated_from_case_id);
    const sourceCase = migratedFromCaseId
      ? sourceCaseMap.get(migratedFromCaseId)
      : undefined;

    const aiScreeningNotes = sourceCase?.ai_screening_notes
      ? parseJsonRecord(sourceCase.ai_screening_notes)
      : {};

    const statusMap: Record<
      string,
      "New Intake" | "Under Review" | "Accepted" | "Rejected" | "Converted to Case" | "Archived"
    > = {
      New: "New Intake",
      Reviewed: "Under Review",
      Accepted: "Accepted",
      Rejected: "Rejected",
      Archived: "Archived",
      "Converted to Case": "Converted to Case",
    };

    const accidentType =
      lead.accident_type ??
      sourceCase?.case_type ??
      getString(top.accident_type, nested.accident_type) ??
      "Unknown";

    const dateOfIncident =
      lead.accident_date ??
      sourceCase?.accident_date ??
      getString(top.accident_date, nested.accident_date) ??
      "Not provided";

    const location =
      getString(
        nested.location,
        nested.accident_location,
        top.location,
        top.accident_location,
        sourceCase?.accident_location
      ) ?? "Not provided";

    const defendant =
      getString(
        nested.defendant,
        nested.at_fault_party,
        top.defendant,
        top.at_fault_party
      ) ?? "Unknown";

    const treatment =
      getString(
        nested.treatment,
        nested.medical_treatment,
        top.treatment,
        top.medical_treatment
      ) ?? "Not provided";

    const incidentDescription =
      getString(
        nested.incident_description,
        nested.accident_description,
        nested.intake_notes,
        top.incident_description,
        top.accident_description,
        top.intake_notes,
        sourceCase?.accident_description,
        lead.ai_summary
      ) ?? "";

    const aiSummary =
      lead.ai_summary ??
      getString(
        top.ai_summary,
        nested.ai_summary,
        aiScreeningNotes.reasoning,
        sourceCase?.accident_description
      ) ??
      "No AI summary available.";

    const source =
      getString(
        lead.utm_source,
        top.utm_source,
        nested.utm_source,
        nested.source_type,
        top.source_type
      ) ?? "AI Intake";

    const score =
      getNumber(
        top.screening_score,
        nested.screening_score,
        sourceCase?.screening_score,
        aiScreeningNotes.viability_score
      ) ?? 70;

    const priorityRaw = getString(nested.priority, top.priority);
    const priority: "Low" | "Medium" | "High" =
      priorityRaw === "Low" || priorityRaw === "Medium" || priorityRaw === "High"
        ? priorityRaw
        : scoreToPriority(score);

    const injuriesArray = parseInjuries(
      lead.injuries ??
        nested.injuries ??
        top.injuries ??
        getString(sourceCase?.injury_severity)
    );

    const evidenceFiles = Array.isArray(nested.evidence_files)
      ? nested.evidence_files.filter(
          (file): file is string =>
            typeof file === "string" && file.trim().length > 0
        )
      : Array.isArray(top.evidence_files)
      ? top.evidence_files.filter(
          (file): file is string =>
            typeof file === "string" && file.trim().length > 0
        )
      : [];

    return {
      id: lead.id,
      clientName: lead.client_name,
      phone: lead.phone || sourceCase?.phone || "N/A",
      email: lead.email || sourceCase?.email || "",
      source,
      priority,
      score,
      caseType: accidentType,
      dateOfIncident,
      location,
      defendant,
      injuries: injuriesArray.length > 0 ? injuriesArray : ["Not provided"],
      treatment,
      aiSummary,
      aiRecommendation:
        getString(aiScreeningNotes.recommendation)?.toLowerCase() === "reject"
          ? ("Reject" as const)
          : ("Accept" as const),
      strategyMemo:
        incidentDescription ||
        aiSummary ||
        "No strategy memo available.",
      incidentDescription,
      evidenceFiles,
      status: statusMap[lead.status] ?? "New Intake",
      submittedAt: formatCentralTime(lead.created_at),
      lang:
        lead.lang ??
        sourceCase?.client_language ??
        getString(top.client_language, top.lang, nested.client_language, nested.lang) ??
        "",
      utmSource:
        lead.utm_source ?? getString(top.utm_source, nested.utm_source) ?? "",
      utmCampaign:
        lead.utm_campaign ??
        getString(top.utm_campaign, nested.utm_campaign) ??
        "",
    };
  });

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#2b2b2b]">Leads</h1>
          <p className="mt-2 text-[#6b6b6b]">
            Intake review queue fed by the Vanguardia intake AI through Zapier.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08]">
            Sync Leads
          </button>

          <div className="rounded-full border border-[#e4c9c4] bg-[#fdf6f5] px-4 py-2 text-sm text-[#4b0a06]">
            Source: AI Intake → Zapier → CRM
          </div>
        </div>
      </div>

      <LeadsWorkspace initialLeads={normalizedLeads} />
    </>
  );
}