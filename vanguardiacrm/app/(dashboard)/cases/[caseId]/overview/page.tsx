import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import CaseOverview from "@/components/case/CaseOverview";

export const dynamic = 'force-dynamic';

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
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function getNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === "string" && value.trim()) {
    try { return asRecord(JSON.parse(value)); } catch { return {}; }
  }
  return {};
}

export default async function CaseOverviewPage({ params }: PageProps) {
  const { caseId } = await params;

  const [caseResult, defendantsResult, providersResult] = await Promise.all([
    supabaseAdmin
      .from("cases")
      .select(`
        id, case_number, client_name, phone, email, preferred_language,
        case_status, case_type, accident_date, accident_location,
        accident_description, created_at, last_status_change,
        assigned_to, source_channel,
        screening_score, estimated_case_value, liability_assessment,
        injury_severity, ai_case_type_confidence, ai_screening_notes,
        raw_payload
      `)
      .eq("id", caseId)
      .single(),

    supabaseAdmin
      .from("defendants")
      .select("id, defendant_name, insurance_carrier, adjuster_name, adjuster_phone, adjuster_email, claim_number, policy_limits, bi_limits")
      .eq("case_id", caseId),

    supabaseAdmin
      .from("case_providers")
      .select(`
        id, treatment_description, treatment_status,
        first_visit_date, last_visit_date, records_status, billing_status,
        providers ( name, provider_type, specialty )
      `)
      .eq("case_id", caseId)
      .order("created_at", { ascending: true }),
  ]);

  if (caseResult.error || !caseResult.data) notFound();

  const providerIds = (providersResult.data ?? []).map((p) => p.id);

  const { data: financials } = providerIds.length > 0
    ? await supabaseAdmin
        .from("case_provider_financials")
        .select("*")
        .in("case_provider_id", providerIds)
    : { data: [] };

  console.log('[overview] providers data:', JSON.stringify(providersResult.data, null, 2))
  console.log('[overview] financials data:', JSON.stringify(financials, null, 2))

  const providersWithFinancials = (providersResult.data ?? []).map((p) => ({
    ...p,
    case_provider_financials: (financials ?? []).filter((f) => f.case_provider_id === p.id),
  }));

  const c = caseResult.data;
  const raw = asRecord(c.raw_payload);
  const nested = asRecord(asRecord(raw.raw_payload) as unknown as Record<string, unknown>);
  const aiNotes = parseJsonRecord(c.ai_screening_notes);

  const accidentLocation = getString(
    c.accident_location, raw.accident_location, nested.accident_location,
    raw.location, nested.location
  );
  const accidentDescription = getString(
    c.accident_description, raw.accident_description, nested.accident_description,
    raw.incident_description, nested.incident_description,
    raw.intake_notes, nested.intake_notes
  );
  const screeningScore = getNumber(c.screening_score, raw.screening_score, aiNotes.viability_score);
  const estimatedCaseValue = getNumber(c.estimated_case_value, raw.estimated_case_value, aiNotes.estimated_value_high);
  const liabilityAssessment = getString(c.liability_assessment, raw.liability_assessment, aiNotes.liability_assessment);
  const injurySeverity = getString(c.injury_severity, raw.injury_severity, aiNotes.injury_severity);
  const aiCaseTypeConfidence = getNumber(c.ai_case_type_confidence, raw.ai_case_type_confidence, aiNotes.case_type_confidence);
  const aiSummary = getString(aiNotes.reasoning, raw.ai_summary, c.accident_description);
  const redFlags = Array.isArray(aiNotes.red_flags)
    ? aiNotes.red_flags.filter((f): f is string => typeof f === "string" && f.trim().length > 0)
    : [];

  return (
    <CaseOverview
      caseData={{
        id: c.id,
        caseNumber: c.case_number ?? "",
        clientName: c.client_name ?? "Unknown",
        phone: c.phone ?? "",
        email: c.email ?? "",
        preferredLanguage: c.preferred_language ?? "en",
        caseStatus: c.case_status ?? "intake",
        caseType: c.case_type ?? "",
        accidentDate: c.accident_date ?? "",
        accidentLocation,
        accidentDescription,
        createdAt: c.created_at ?? "",
        lastStatusChange: c.last_status_change ?? "",
        assignedTo: c.assigned_to ?? "",
        sourceChannel: c.source_channel ?? "",
        screeningScore,
        estimatedCaseValue,
        liabilityAssessment,
        injurySeverity,
        aiCaseTypeConfidence,
        aiSummary,
        redFlags,
      }}
      defendants={defendantsResult.data ?? []}
      caseProviders={providersWithFinancials as CaseProviderRow[]}
    />
  );
}

// Exported so the component file can import it
export type CaseProviderRow = {
  id: string
  treatment_description: string | null
  treatment_status: string | null
  first_visit_date: string | null
  last_visit_date: string | null
  records_status: string | null
  billing_status: string | null
  providers: { name: string; provider_type: string | null; specialty: string | null } | { name: string; provider_type: string | null; specialty: string | null }[] | null
  case_provider_financials: { original_bill: number | null; adjusted_bill: number | null; still_owed: number | null; paid_plus_owed: number | null; client_paid: number | null; medpay_pip_paid: number | null; insurance_paid: number | null }[] | null
}
