export const dynamic = "force-dynamic";

import LeadsWorkspace from "../../components/LeadsWorkspace";
import { createClient } from "@/lib/supabase/client";
import type { LeadRecord } from "../../../types/leads";

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

export default async function LeadsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  console.log("LEADS ERROR:", error);
  console.log("LEADS COUNT:", data?.length);

  if (error) {
    console.error("Failed to load leads:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  const leads: LeadRecord[] = data ?? [];

  const normalizedLeads = leads.map((lead) => {
    const { top, nested } = getNestedRawPayload(lead.raw_payload);

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
      getString(top.accident_type, nested.accident_type) ??
      "Unknown";

    const location =
      getString(
        nested.location,
        nested.accident_location,
        top.location,
        top.accident_location
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
        top.intake_notes
      ) ?? "";

    const source =
      getString(
        lead.utm_source,
        top.utm_source,
        nested.utm_source,
        nested.source_type,
        top.source_type
      ) ?? "AI Intake";

    const priorityRaw =
      getString(
        nested.priority,
        top.priority
      ) ?? "Medium";

    const priority: "Low" | "Medium" | "High" =
      priorityRaw === "Low" || priorityRaw === "Medium" || priorityRaw === "High"
        ? priorityRaw
        : "Medium";

    const injuriesArray = parseInjuries(
      lead.injuries ?? nested.injuries ?? top.injuries
    );

    const evidenceFiles = Array.isArray(nested.evidence_files)
      ? nested.evidence_files.filter(
          (file): file is string => typeof file === "string" && file.trim().length > 0
        )
      : Array.isArray(top.evidence_files)
      ? top.evidence_files.filter(
          (file): file is string => typeof file === "string" && file.trim().length > 0
        )
      : [];

    return {
      id: lead.id,
      clientName: lead.client_name,
      phone: lead.phone ?? "N/A",
      email: lead.email ?? "",
      source,
      priority,
      score: priority === "High" ? 85 : priority === "Low" ? 45 : 70,
      caseType: accidentType,
      dateOfIncident:
        lead.accident_date ??
        getString(top.accident_date, nested.accident_date) ??
        "Not provided",
      location,
      defendant,
      injuries: injuriesArray.length > 0 ? injuriesArray : ["Not provided"],
      treatment,
      aiSummary: lead.ai_summary ?? getString(top.ai_summary, nested.ai_summary) ?? "No AI summary available.",
      aiRecommendation: "Accept" as const,
      strategyMemo:
        incidentDescription ||
        lead.ai_summary ||
        getString(top.ai_summary, nested.ai_summary) ||
        "No strategy memo available.",
      incidentDescription,
      evidenceFiles,
      status: statusMap[lead.status] ?? "New Intake",
      submittedAt: formatCentralTime(lead.created_at),
      lang: lead.lang ?? getString(top.lang, nested.lang) ?? "",
      utmSource: lead.utm_source ?? getString(top.utm_source, nested.utm_source) ?? "",
      utmCampaign: lead.utm_campaign ?? getString(top.utm_campaign, nested.utm_campaign) ?? "",
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