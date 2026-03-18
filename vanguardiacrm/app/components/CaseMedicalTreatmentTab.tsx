"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type MedicalFormData = {
  first_treatment_date: string;
  last_treatment_date: string;
  currently_treating: string;
  gap_in_treatment: string;
  primary_injuries_summary: string;
  surgery_recommended: string;
  surgery_details: string;
  providers: string;
  records_requested_date: string;
  records_received_date: string;
  bills_requested_date: string;
  bills_received_date: string;
  lien_notes: string;
  insurance_notes: string;
};

type Props = {
  caseNumber: string;
  initialData: MedicalFormData;
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
      <td className="w-64 bg-[#fafafa] px-4 py-3 font-medium text-[#2b2b2b]">
        {label}
      </td>
      <td className="px-4 py-3 text-[#444444]">{value}</td>
    </tr>
  );
}

export default function CaseMedicalTreatmentTab({
  caseNumber,
  initialData,
}: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<MedicalFormData>(() => initialData);

  useEffect(() => {
    setForm(initialData);
  }, [initialData]);

  function updateField<K extends keyof MedicalFormData>(
    key: K,
    value: MedicalFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/cases/${caseNumber}/medical-treatment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to update medical treatment");
      }

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update medical treatment"
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

  if (!form) {
    return (
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
        <p className="text-sm text-[#666666]">Loading medical treatment data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
        <div className="flex items-center justify-between border-b border-[#eeeeee] pb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#2b2b2b]">
              Medical Treatment
            </h2>
            <p className="mt-1 text-sm text-[#666666]">
              Treatment history, providers, records, bills, and lien notes.
            </p>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08]"
            >
              Edit Medical Treatment
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
                    Treatment Overview
                  </h3>
                </div>
                <table className="min-w-full text-sm">
                  <tbody>
                    <InfoRow label="First Treatment Date" value={displayValue(form.first_treatment_date)} />
                    <InfoRow label="Last Treatment Date" value={displayValue(form.last_treatment_date)} />
                    <InfoRow label="Currently Treating" value={displayValue(form.currently_treating)} />
                    <InfoRow label="Gap in Treatment" value={displayValue(form.gap_in_treatment)} />
                    <InfoRow label="Surgery Recommended" value={displayValue(form.surgery_recommended)} />
                  </tbody>
                </table>
              </div>

              <div className="overflow-hidden rounded-lg border border-[#e5e5e5]">
                <div className="border-b border-[#eeeeee] bg-[#fcfcfc] px-4 py-3">
                  <h3 className="text-sm font-semibold text-[#2b2b2b]">
                    Records & Bills
                  </h3>
                </div>
                <table className="min-w-full text-sm">
                  <tbody>
                    <InfoRow label="Records Requested" value={displayValue(form.records_requested_date)} />
                    <InfoRow label="Records Received" value={displayValue(form.records_received_date)} />
                    <InfoRow label="Bills Requested" value={displayValue(form.bills_requested_date)} />
                    <InfoRow label="Bills Received" value={displayValue(form.bills_received_date)} />
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-4">
              <h3 className="text-sm font-semibold text-[#2b2b2b]">
                Primary Injuries Summary
              </h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#444444]">
                {displayValue(form.primary_injuries_summary)}
              </p>
            </div>

            <div className="rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-4">
              <h3 className="text-sm font-semibold text-[#2b2b2b]">
                Surgery Details
              </h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#444444]">
                {displayValue(form.surgery_details)}
              </p>
            </div>

            <div className="rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-4">
              <h3 className="text-sm font-semibold text-[#2b2b2b]">
                Providers
              </h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#444444]">
                {displayValue(form.providers)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-4">
                <h3 className="text-sm font-semibold text-[#2b2b2b]">
                  Lien Notes
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#444444]">
                  {displayValue(form.lien_notes)}
                </p>
              </div>

              <div className="rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-4">
                <h3 className="text-sm font-semibold text-[#2b2b2b]">
                  Insurance Notes
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#444444]">
                  {displayValue(form.insurance_notes)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            <div>
              <h3 className="mb-4 text-sm font-semibold text-[#2b2b2b]">
                Treatment Overview
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    First Treatment Date
                  </label>
                  <input
                    type="date"
                    value={form.first_treatment_date}
                    onChange={(e) => updateField("first_treatment_date", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Last Treatment Date
                  </label>
                  <input
                    type="date"
                    value={form.last_treatment_date}
                    onChange={(e) => updateField("last_treatment_date", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Currently Treating
                  </label>
                  <select
                    value={form.currently_treating}
                    onChange={(e) => updateField("currently_treating", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Gap in Treatment
                  </label>
                  <input
                    value={form.gap_in_treatment}
                    onChange={(e) => updateField("gap_in_treatment", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Surgery Recommended
                  </label>
                  <select
                    value={form.surgery_recommended}
                    onChange={(e) => updateField("surgery_recommended", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                Primary Injuries Summary
              </label>
              <textarea
                value={form.primary_injuries_summary}
                onChange={(e) => updateField("primary_injuries_summary", e.target.value)}
                rows={4}
                className="w-full rounded-md border border-[#d9d9d9] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                Surgery Details
              </label>
              <textarea
                value={form.surgery_details}
                onChange={(e) => updateField("surgery_details", e.target.value)}
                rows={4}
                className="w-full rounded-md border border-[#d9d9d9] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                Providers
              </label>
              <textarea
                value={form.providers}
                onChange={(e) => updateField("providers", e.target.value)}
                rows={6}
                className="w-full rounded-md border border-[#d9d9d9] px-4 py-3"
              />
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold text-[#2b2b2b]">
                Records & Bills Tracking
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Records Requested Date
                  </label>
                  <input
                    type="date"
                    value={form.records_requested_date}
                    onChange={(e) => updateField("records_requested_date", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Records Received Date
                  </label>
                  <input
                    type="date"
                    value={form.records_received_date}
                    onChange={(e) => updateField("records_received_date", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Bills Requested Date
                  </label>
                  <input
                    type="date"
                    value={form.bills_requested_date}
                    onChange={(e) => updateField("bills_requested_date", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Bills Received Date
                  </label>
                  <input
                    type="date"
                    value={form.bills_received_date}
                    onChange={(e) => updateField("bills_received_date", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                Lien Notes
              </label>
              <textarea
                value={form.lien_notes}
                onChange={(e) => updateField("lien_notes", e.target.value)}
                rows={4}
                className="w-full rounded-md border border-[#d9d9d9] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                Insurance Notes
              </label>
              <textarea
                value={form.insurance_notes}
                onChange={(e) => updateField("insurance_notes", e.target.value)}
                rows={4}
                className="w-full rounded-md border border-[#d9d9d9] px-4 py-3"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}