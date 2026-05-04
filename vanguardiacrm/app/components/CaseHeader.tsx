"use client";

import { useEffect, useState } from "react";
import { formatCaseType } from "@/lib/formatters/caseType";
import { formatPersonName } from "@/lib/formatters/name";

type CaseHeaderProps = {
  caseData: {
    id: string;
    clientName: string;
    dateOfIncident: string;
    caseType: string;
    status: string;
    phase?: string | null;
    phone: string;
    email: string;
    assignedTo: string;
    office: string;
  };
};

const casePhases = [
  "Welcome",
  "Treatment Phase",
  "Demand Prep",
  "Demand Sent",
  "Negotiation",
  "Settlement",
  "Closed",
];

function getDisplayPhase(phase: string | null | undefined) {
  return phase && casePhases.includes(phase) ? phase : "Welcome";
}

function getPhaseStyles(phase: string) {
  switch (phase) {
    case "Settlement":
    case "Closed":
      return "border-[#b9e4cf] bg-[#ecf8f1] text-[#1f7a4d]";
    case "Negotiation":
      return "border-[#dec8f7] bg-[#f8f0ff] text-[#6b2ea6]";
    case "Demand Prep":
    case "Demand Sent":
      return "border-[#c9daf7] bg-[#eef4ff] text-[#1d4f91]";
    case "Welcome":
      return "border-[#f1d9a6] bg-[#fff7e8] text-[#8a5a00]";
    case "Treatment Phase":
    default:
      return "border-[#e4c9c4] bg-[#fdf6f5] text-[#4b0a06]";
  }
}

export default function CaseHeader({ caseData }: CaseHeaderProps) {
  const [phase, setPhase] = useState(() => getDisplayPhase(caseData.phase));
  const [editingPhase, setEditingPhase] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPhase(getDisplayPhase(caseData.phase));
  }, [caseData.phase]);

  async function handlePhaseChange(nextPhase: string) {
    const previousPhase = phase;

    setPhase(nextPhase);
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/cases/${caseData.id}/phase`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phase: nextPhase,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to update case phase");
      }

      setEditingPhase(false);
    } catch (error) {
      setPhase(previousPhase);
      setError(
        error instanceof Error ? error.message : "Failed to update case phase"
      );
    } finally {
      setSaving(false);
    }
  }
  async function handleCloseCase() {
  await handlePhaseChange("Closed");
}

  return (
    <header className="border-b border-[#e5e5e5] bg-white px-6 py-5">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-[#2b2b2b]">
              {formatPersonName(caseData.clientName)} - DOI{" "}
              {caseData.dateOfIncident}
            </h1>

            <p className="mt-2 text-sm text-[#6b6b6b]">
              {caseData.phone} | {caseData.email} |{" "}
              {formatCaseType(caseData.caseType)} | {caseData.office} |{" "}
              {formatPersonName(caseData.assignedTo)}
            </p>

            {error ? (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            ) : null}
          </div>

          <div className="min-w-55">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#6b6b6b]">
              Case Phase
            </label>

            {!editingPhase ? (
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex rounded-md border px-4 py-2 text-sm font-medium ${getPhaseStyles(
                    phase
                  )}`}
                >
                  {phase}
                </span>

                <button
                  type="button"
                  onClick={() => setEditingPhase(true)}
                  className="rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-sm text-[#555555] hover:bg-[#f7f7f7]"
                >
                  ⋯
                </button>
              </div>
            ) : (
              <select
                value={phase}
                disabled={saving}
                onChange={(event) => handlePhaseChange(event.target.value)}
                className={`w-full rounded-md border px-4 py-2 text-sm font-medium outline-none disabled:opacity-60 ${getPhaseStyles(
                  phase
                )}`}
              >
                {casePhases.map((phaseOption) => (
                  <option key={phaseOption} value={phaseOption}>
                    {phaseOption}
                  </option>
                ))}
              </select>
            )}

            {saving ? (
              <p className="mt-2 text-xs text-[#6b6b6b]">Saving...</p>
            ) : null}
            <button
  type="button"
  onClick={() => handlePhaseChange("Closed")}
  disabled={saving || phase === "Closed"}
  className="mt-3 w-full rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-xs font-medium text-[#2b2b2b] hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-50"
>
  Close Case
</button>
          </div>
        </div>
      </div>
    </header>
  );
}