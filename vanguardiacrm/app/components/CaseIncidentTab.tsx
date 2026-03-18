"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type IncidentFormData = {
  accident_date: string;
  incident_time: string;
  incident_type: string;
  location: string;
  city: string;
  state: string;
  client_role: string;
  defendant: string;
  police_report_number: string;
  investigating_agency: string;
  witness_info: string;
  conditions: string;
  narrative: string;
  liability_notes: string;
};

type Props = {
  caseNumber: string;
  initialData: IncidentFormData;
};

function displayValue(value: string) {
  return value?.trim() ? value : "—";
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <tr className="border-b border-[#eeeeee] last:border-b-0">
      <td className="w-56 bg-[#fafafa] px-4 py-3 font-medium text-[#2b2b2b]">
        {label}
      </td>
      <td className="px-4 py-3 text-[#444444]">{value}</td>
    </tr>
  );
}

export default function CaseIncidentTab({ caseNumber, initialData }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<IncidentFormData>(initialData);

  useEffect(() => {
    setForm(initialData);
  }, [initialData]);

  function updateField<K extends keyof IncidentFormData>(
    key: K,
    value: IncidentFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/cases/${caseNumber}/incident`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to update incident information");
      }

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update incident information"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm(initialData);
    setIsEditing(false);
    setError(null);
  }

  const fullLocation = [form.location, form.city, form.state]
    .filter((part) => part?.trim())
    .join(", ");

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
        <div className="flex items-center justify-between border-b border-[#eeeeee] pb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#2b2b2b]">
              Incident Details
            </h2>
            <p className="mt-1 text-sm text-[#666666]">
              Liability facts, scene information, and incident narrative.
            </p>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08]"
            >
              Edit Incident
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {!isEditing ? (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="overflow-hidden rounded-lg border border-[#e5e5e5]">
                <div className="border-b border-[#eeeeee] bg-[#fcfcfc] px-4 py-3">
                  <h3 className="text-sm font-semibold text-[#2b2b2b]">
                    Scene Summary
                  </h3>
                </div>
                <table className="min-w-full text-sm">
                  <tbody>
                    <InfoRow
                      label="Date of Incident"
                      value={displayValue(form.accident_date)}
                    />
                    <InfoRow
                      label="Incident Time"
                      value={displayValue(form.incident_time)}
                    />
                    <InfoRow
                      label="Incident Type"
                      value={displayValue(form.incident_type)}
                    />
                    <InfoRow
                      label="Location"
                      value={displayValue(fullLocation)}
                    />
                    <InfoRow
                      label="Client Role"
                      value={displayValue(form.client_role)}
                    />
                    <InfoRow
                      label="Defendant / At-Fault Party"
                      value={displayValue(form.defendant)}
                    />
                  </tbody>
                </table>
              </div>

              <div className="overflow-hidden rounded-lg border border-[#e5e5e5]">
                <div className="border-b border-[#eeeeee] bg-[#fcfcfc] px-4 py-3">
                  <h3 className="text-sm font-semibold text-[#2b2b2b]">
                    Investigation
                  </h3>
                </div>
                <table className="min-w-full text-sm">
                  <tbody>
                    <InfoRow
                      label="Police Report Number"
                      value={displayValue(form.police_report_number)}
                    />
                    <InfoRow
                      label="Investigating Agency"
                      value={displayValue(form.investigating_agency)}
                    />
                    <InfoRow
                      label="Witness Information"
                      value={displayValue(form.witness_info)}
                    />
                    <InfoRow
                      label="Conditions"
                      value={displayValue(form.conditions)}
                    />
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-4">
              <h3 className="text-sm font-semibold text-[#2b2b2b]">
                Incident Narrative
              </h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#444444]">
                {displayValue(form.narrative)}
              </p>
            </div>

            <div className="rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-4">
              <h3 className="text-sm font-semibold text-[#2b2b2b]">
                Liability Notes
              </h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#444444]">
                {displayValue(form.liability_notes)}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            <div>
              <h3 className="mb-4 text-sm font-semibold text-[#2b2b2b]">
                Scene Summary
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Date of Incident
                  </label>
                  <input
                    type="date"
                    value={form.accident_date}
                    onChange={(e) => updateField("accident_date", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Incident Time
                  </label>
                  <input
                    type="time"
                    value={form.incident_time}
                    onChange={(e) => updateField("incident_time", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Incident Type
                  </label>
                  <input
                    value={form.incident_type}
                    onChange={(e) => updateField("incident_type", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Location
                  </label>
                  <input
                    value={form.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    City
                  </label>
                  <input
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    State
                  </label>
                  <input
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Client Role
                  </label>
                  <input
                    value={form.client_role}
                    onChange={(e) => updateField("client_role", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Defendant / At-Fault Party
                  </label>
                  <input
                    value={form.defendant}
                    onChange={(e) => updateField("defendant", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold text-[#2b2b2b]">
                Investigation
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Police Report Number
                  </label>
                  <input
                    value={form.police_report_number}
                    onChange={(e) =>
                      updateField("police_report_number", e.target.value)
                    }
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Investigating Agency
                  </label>
                  <input
                    value={form.investigating_agency}
                    onChange={(e) =>
                      updateField("investigating_agency", e.target.value)
                    }
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Witness Information
                  </label>
                  <textarea
                    value={form.witness_info}
                    onChange={(e) => updateField("witness_info", e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-3"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Conditions
                  </label>
                  <textarea
                    value={form.conditions}
                    onChange={(e) => updateField("conditions", e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-3"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                Incident Narrative
              </label>
              <textarea
                value={form.narrative}
                onChange={(e) => updateField("narrative", e.target.value)}
                rows={6}
                className="w-full rounded-md border border-[#d9d9d9] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                Liability Notes
              </label>
              <textarea
                value={form.liability_notes}
                onChange={(e) => updateField("liability_notes", e.target.value)}
                rows={5}
                className="w-full rounded-md border border-[#d9d9d9] px-4 py-3"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}