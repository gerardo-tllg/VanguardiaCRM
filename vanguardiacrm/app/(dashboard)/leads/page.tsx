export const dynamic = "force-dynamic";
import LeadsWorkspace from "../../components/LeadsWorkspace";
import { supabaseAdmin } from "../../../lib/supabase/server";
import type { LeadRecord } from "../../../types/leads";

function formatCentralTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function LeadsPage() {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load leads:", error);
  }

  const leads: LeadRecord[] = data ?? [];

  const normalizedLeads = leads.map((lead) => {
    const raw = (lead.raw_payload ?? {}) as Record<string, unknown>;

    const statusMap: Record<string, "New Intake" | "Under Review" | "Accepted" | "Rejected" | "Converted to Case" | "Archived"> = {
      New: "New Intake",
      Reviewed: "Under Review",
      Accepted: "Accepted",
      Rejected: "Rejected",
      Archived: "Archived",
    };

    const accidentType =
      lead.accident_type ??
      (typeof raw.accident_type === "string" ? raw.accident_type : "Unknown");

    const location =
      typeof raw.location === "string"
        ? raw.location
        : typeof raw.accident_location === "string"
        ? raw.accident_location
        : "Not provided";

    const defendant =
      typeof raw.defendant === "string"
        ? raw.defendant
        : typeof raw.at_fault_party === "string"
        ? raw.at_fault_party
        : "Unknown";

    const treatment =
      typeof raw.treatment === "string"
        ? raw.treatment
        : typeof raw.medical_treatment === "string"
        ? raw.medical_treatment
        : "Not provided";

    const source =
      typeof raw.utm_source === "string"
        ? raw.utm_source
        : lead.utm_source ?? "AI Intake";

    const injuriesArray =
      typeof lead.injuries === "string"
        ? lead.injuries
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

    return {
      id: lead.id,
      clientName: lead.client_name,
      phone: lead.phone ?? "N/A",
      email: lead.email ?? "",
      source,
      priority: "Medium" as const,
      score: 70,
      caseType: accidentType,
      dateOfIncident: lead.accident_date ?? "Not provided",
      location,
      defendant,
      injuries: injuriesArray.length > 0 ? injuriesArray : ["Not provided"],
      treatment,
      aiSummary: lead.ai_summary ?? "No AI summary available.",
      aiRecommendation: "Accept" as const,
      strategyMemo: lead.ai_summary ?? "No strategy memo available.",
      evidenceFiles: [],
      status: statusMap[lead.status] ?? "New Intake",
      submittedAt: formatCentralTime(lead.created_at),
      lang: lead.lang ?? "",
      utmSource: lead.utm_source ?? "",
      utmCampaign: lead.utm_campaign ?? "",
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