import Link from "next/link";
import LeadNotesSection from "../components/LeadNotesSection";
import type { LeadNoteRecord } from "@/types/lead-notes";

type LeadDetailProps = {
  lead: {
    id: string;
    client_name: string;
    phone: string | null;
    email: string | null;
    accident_date: string | null;
    accident_type: string | null;
    injuries: string | null;
    ai_summary: string | null;
    status: string;
    created_at: string;
    lang: string | null;
    utm_source: string | null;
    utm_campaign: string | null;
    raw_payload: Record<string, unknown> | null;
  };
  notes: LeadNoteRecord[];
};

function formatCentralTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getStatusStyles(status: string) {
  switch (status) {
    case "Accepted":
      return "bg-[#ecf8f1] text-[#1f7a4d] border border-[#b9e4cf]";
    case "Rejected":
      return "bg-[#f3f3f3] text-[#6b6b6b] border border-[#dddddd]";
    case "Reviewed":
      return "bg-[#fff7e8] text-[#8a5a00] border border-[#f1d9a6]";
    case "Archived":
      return "bg-[#f3f3f3] text-[#8a8a8a] border border-[#dddddd]";
    case "New":
    default:
      return "bg-[#f3e7e5] text-[#4b0a06] border border-[#e4c9c4]";
  }
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
      <span className="text-sm text-[#2b2b2b]">{value}</span>
    </div>
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
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

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    return asRecord(JSON.parse(value));
  } catch {
    return {};
  }
}

export default function LeadDetailView({ lead, notes }: LeadDetailProps) {
  const top = asRecord(lead.raw_payload);
  const nested = asRecord(top.raw_payload);
  const aiScreeningNotes = parseJsonRecord(top.ai_screening_notes);

  const dateOfIncident =
    lead.accident_date ??
    getString(top.accident_date, nested.accident_date) ??
    "Not provided";

  const accidentType =
    lead.accident_type ??
    getString(top.accident_type, nested.accident_type) ??
    "Unknown Case Type";

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
      top.intake_notes,
      lead.ai_summary
    ) ?? "";

  const evidenceFiles = Array.isArray(nested.evidence_files)
    ? nested.evidence_files.filter(
        (file): file is string => typeof file === "string" && file.trim().length > 0
      )
    : Array.isArray(top.evidence_files)
    ? top.evidence_files.filter(
        (file): file is string => typeof file === "string" && file.trim().length > 0
      )
    : [];

  const injuries = parseInjuries(
    lead.injuries ?? nested.injuries ?? top.injuries
  );

  const aiSummary =
    lead.ai_summary ??
    getString(top.ai_summary, nested.ai_summary, aiScreeningNotes.reasoning) ??
    "No AI summary available.";

  const language =
    lead.lang ??
    getString(top.client_language, top.lang, nested.client_language, nested.lang) ??
    "N/A";

  return (
    <div className="mx-auto w-full max-w-375">
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-[#e5e5e5] bg-white p-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/leads"
            className="text-sm font-medium text-[#4b0a06] hover:underline"
          >
            ← Back to Leads
          </Link>

          <h1 className="mt-3 text-3xl font-bold text-[#2b2b2b] lg:text-4xl">
            {lead.client_name}
          </h1>

          <p className="mt-2 text-sm text-[#6b6b6b]">
            {accidentType} · Received {formatCentralTime(lead.created_at)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex rounded-full px-4 py-2 text-sm font-medium ${getStatusStyles(
              lead.status
            )}`}
          >
            {lead.status}
          </span>

          <Link
            href="/leads"
            className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
          >
            Return to Queue
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#2b2b2b]">
              Client Information
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <InfoRow label="Name" value={lead.client_name} />
              <InfoRow label="Phone" value={lead.phone || "N/A"} />
              <InfoRow label="Email" value={lead.email || "N/A"} />
              <InfoRow label="Language" value={language} />
              <InfoRow
                label="Received"
                value={formatCentralTime(lead.created_at)}
              />
              <InfoRow label="Status" value={lead.status} />
            </div>
          </div>

          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#2b2b2b]">
              Accident Details
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <InfoRow label="Date of Incident" value={dateOfIncident} />
              <InfoRow label="Accident Type" value={accidentType} />
              <InfoRow label="Location" value={location} />
              <InfoRow label="Defendant" value={defendant} />
              <InfoRow label="Treatment" value={treatment} />
            </div>
          </div>

          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#2b2b2b]">
              Incident Description
            </h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#444444]">
              {incidentDescription || "No incident description available."}
            </p>
          </div>

          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#2b2b2b]">Injuries</h2>

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
            <h2 className="text-lg font-semibold text-[#2b2b2b]">AI Summary</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#444444]">
              {aiSummary}
            </p>
          </div>

          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#2b2b2b]">
              Evidence Files
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {evidenceFiles.length > 0 ? (
                evidenceFiles.map((file) => (
                  <span
                    key={file}
                    className="inline-flex rounded-md border border-[#e4c9c4] bg-[#fdf6f5] px-3 py-2 text-xs text-[#4b0a06]"
                  >
                    {file}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[#6b6b6b]">No files attached.</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#2b2b2b]">
              Attribution
            </h2>

            <div className="mt-4 space-y-4">
              <InfoRow label="UTM Source" value={lead.utm_source || "N/A"} />
              <InfoRow label="UTM Campaign" value={lead.utm_campaign || "N/A"} />
            </div>
          </div>

          <LeadNotesSection leadId={lead.id} initialNotes={notes} />
        </div>
      </div>
    </div>
  );
}