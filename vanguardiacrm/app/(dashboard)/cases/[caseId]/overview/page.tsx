import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

function getNumber(...values: unknown[]): number | null {
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
  return null;
}

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return asRecord(parsed);
    } catch {
      return {};
    }
  }
  return {};
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

function formatCurrency(value: number | null) {
  if (value == null) return "—";
  return `$${value.toLocaleString()}`;
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-[#6b6b6b]">
        {label}
      </span>
      <span className="text-sm text-[#2b2b2b]">{value || "—"}</span>
    </div>
  );
}

export default async function CaseOverviewPage({ params }: PageProps) {
  const { caseId } = await params;

  const { data: caseRecord, error } = await supabaseAdmin
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .single();

  if (error || !caseRecord) {
    notFound();
  }

  const raw = asRecord(caseRecord.raw_payload);
  const nested = asRecord(raw.raw_payload);
  const aiScreeningNotes = parseJsonRecord(caseRecord.ai_screening_notes);

  const clientLanguage = getString(
    caseRecord.client_language,
    raw.client_language,
    nested.client_language,
    raw.lang,
    nested.lang
  );

  const accidentDate = caseRecord.accident_date
    ? String(caseRecord.accident_date)
    : getString(raw.accident_date, nested.accident_date);

  const accidentLocation = getString(
    caseRecord.accident_location,
    raw.accident_location,
    nested.accident_location,
    raw.location,
    nested.location
  );

  const accidentDescription = getString(
    caseRecord.accident_description,
    raw.accident_description,
    nested.accident_description,
    raw.incident_description,
    nested.incident_description,
    raw.intake_notes,
    nested.intake_notes
  );

  const injuries = parseInjuries(
    raw.injuries ?? nested.injuries
  );

  const screeningScore = getNumber(
    caseRecord.screening_score,
    raw.screening_score,
    nested.screening_score,
    aiScreeningNotes.viability_score
  );

  const estimatedCaseValue = getNumber(
    caseRecord.estimated_case_value,
    raw.estimated_case_value,
    nested.estimated_case_value,
    aiScreeningNotes.estimated_value_high,
    aiScreeningNotes.estimated_value_low
  );

  const liabilityAssessment = getString(
    caseRecord.liability_assessment,
    raw.liability_assessment,
    nested.liability_assessment,
    aiScreeningNotes.liability_assessment
  );

  const injurySeverity = getString(
    caseRecord.injury_severity,
    raw.injury_severity,
    nested.injury_severity,
    aiScreeningNotes.injury_severity
  );

  const caseTypeConfidence = getNumber(
    caseRecord.ai_case_type_confidence,
    raw.ai_case_type_confidence,
    nested.ai_case_type_confidence,
    aiScreeningNotes.case_type_confidence
  );

  const rawRecommendation = getString(aiScreeningNotes.recommendation).toLowerCase();

let recommendation: "Recommend" | "Review" | "Do Not Recommend" | "" = "";

// 1. Use explicit AI output if valid
if (rawRecommendation === "recommend") {
  recommendation = "Recommend";
} else if (rawRecommendation === "not recommend" || rawRecommendation === "reject") {
  recommendation = "Do Not Recommend";
}

// 2. Otherwise infer from screening score
else if (screeningScore != null) {
  if (screeningScore >= 75) {
    recommendation = "Recommend";
  } else if (screeningScore >= 50) {
    recommendation = "Review";
  } else {
    recommendation = "Do Not Recommend";
  }
}

  const reasoning = getString(
    aiScreeningNotes.reasoning,
    raw.ai_summary,
    nested.ai_summary,
    caseRecord.accident_description
  );

  const redFlags = Array.isArray(aiScreeningNotes.red_flags)
    ? aiScreeningNotes.red_flags.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0
      )
    : [];

  const attributionSource = getString(
    raw.utm_source,
    nested.utm_source,
    caseRecord.source_channel
  );

  const attributionCampaign = getString(
    raw.utm_campaign,
    nested.utm_campaign,
    caseRecord.source_campaign
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
        <h2 className="text-xl font-semibold text-[#2b2b2b]">Overview</h2>
        <p className="mt-2 text-sm text-[#6b6b6b]">
          Client snapshot, AI screening details, and incident summary.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#2b2b2b]">
              Client Snapshot
            </h3>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <InfoRow label="Client Name" value={caseRecord.client_name ?? ""} />
              <InfoRow label="Phone" value={caseRecord.phone ?? "N/A"} />
              <InfoRow label="Email" value={caseRecord.email ?? "N/A"} />
              <InfoRow label="Language" value={clientLanguage || "N/A"} />
              <InfoRow label="Case Number" value={caseRecord.case_number ?? "—"} />
              <InfoRow label="Phase" value={caseRecord.phase ?? "Welcome"} />
            </div>
          </div>

          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#2b2b2b]">
              Incident Snapshot
            </h3>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <InfoRow label="Date of Incident" value={accidentDate || "—"} />
              <InfoRow
                label="Incident Type"
                value={caseRecord.case_type ?? "—"}
              />
              <InfoRow label="Location" value={accidentLocation || "—"} />
            </div>

            <div className="mt-5">
              <h4 className="text-sm font-semibold text-[#2b2b2b]">
                Incident Description
              </h4>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#444444]">
                {accidentDescription || "No incident description available."}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#2b2b2b]">
              AI Screening Snapshot
            </h3>

            {recommendation && (
  <div className="mt-4 flex items-center justify-between gap-3">
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        recommendation === "Recommend"
          ? "border border-[#b9e4cf] bg-[#ecf8f1] text-[#1f7a4d]" // green
          : recommendation === "Review"
          ? "border border-[#f5e6b3] bg-[#fff9e6] text-[#8a6d1d]" // yellow
          : "border border-[#f2b8b5] bg-[#fdecea] text-[#b42318]" // red
      }`}
    >
      Recommendation: {recommendation}
    </span>
  </div>
)}

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <InfoRow
                label="Screening Score"
                value={screeningScore != null ? `${screeningScore}/100` : "—"}
              />
              <InfoRow
                label="Estimated Case Value"
                value={formatCurrency(estimatedCaseValue)}
              />
              <InfoRow
                label="Liability Assessment"
                value={liabilityAssessment || "—"}
              />
              <InfoRow
                label="Injury Severity"
                value={injurySeverity || "—"}
              />
              <InfoRow
                label="Case Type Confidence"
                value={
                  caseTypeConfidence != null ? String(caseTypeConfidence) : "—"
                }
              />
            </div>

            <div className="mt-5">
              <h4 className="text-sm font-semibold text-[#2b2b2b]">
                AI Summary
              </h4>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#444444]">
                {reasoning || "No AI summary available."}
              </p>
            </div>

            <div className="mt-5">
              <h4 className="text-sm font-semibold text-[#2b2b2b]">
                Red Flags
              </h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {redFlags.length > 0 ? (
                  redFlags.map((flag) => (
                    <span
                      key={flag}
                      className="inline-flex rounded-full border border-[#e5e5e5] bg-[#fcfcfc] px-3 py-1 text-xs text-[#444444]"
                    >
                      {flag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#6b6b6b]">No red flags noted.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#2b2b2b]">Injuries</h3>

            <div className="mt-4 flex flex-wrap gap-2">
              {injuries.length > 0 ? (
                injuries.map((injury) => (
                  <span
                    key={injury}
                    className="inline-flex rounded-full border border-[#e5e5e5] bg-[#fcfcfc] px-3 py-1 text-xs text-[#444444]"
                  >
                    {injury}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[#6b6b6b]">No injuries listed.</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#2b2b2b]">
              Attribution
            </h3>

            <div className="mt-4 space-y-4">
              <InfoRow label="UTM Source" value={attributionSource || "N/A"} />
              <InfoRow
                label="UTM Campaign"
                value={attributionCampaign || "N/A"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}