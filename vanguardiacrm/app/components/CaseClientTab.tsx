"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ClientFormData = {
  client_name: string;
  phone: string;
  email: string;
  accident_date: string;
  dob: string;
  ssn: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  zip: string;
  preferred_language: string;
};

type Props = {
  caseNumber: string;
  initialData: ClientFormData;
};

function displayValue(value: string) {
  return value?.trim() ? value : "—";
}

function maskedSsn(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "—";
  if (trimmed.length <= 4) return trimmed;
  return `***-**-${trimmed.slice(-4)}`;
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

export default function CaseClientTab({ caseNumber, initialData }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ClientFormData>(initialData);

  useEffect(() => {
    setForm(initialData);
  }, [initialData]);

  function updateField<K extends keyof ClientFormData>(
    key: K,
    value: ClientFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/cases/${caseNumber}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to update client information");
      }

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update client information"
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

  const fullAddress = [
    form.address_line_1,
    form.address_line_2,
    [form.city, form.state].filter(Boolean).join(", "),
    form.zip,
  ]
    .filter((part) => part?.trim())
    .join(" ");

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
        <div className="flex items-center justify-between border-b border-[#eeeeee] pb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#2b2b2b]">
              Client Information
            </h2>
            <p className="mt-1 text-sm text-[#666666]">
              Core contact, identity, and intake details for this case.
            </p>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08]"
            >
              Edit Client Info
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
                    Contact Details
                  </h3>
                </div>
                <table className="min-w-full text-sm">
                  <tbody>
                    <InfoRow label="Full Name" value={displayValue(form.client_name)} />
                    <InfoRow label="Phone" value={displayValue(form.phone)} />
                    <InfoRow label="Email" value={displayValue(form.email)} />
                    <InfoRow label="Address" value={displayValue(fullAddress)} />
                    <InfoRow
                      label="Language Preference"
                      value={form.preferred_language === 'es' ? 'Español' : 'English'}
                    />
                  </tbody>
                </table>
              </div>

              <div className="overflow-hidden rounded-lg border border-[#e5e5e5]">
                <div className="border-b border-[#eeeeee] bg-[#fcfcfc] px-4 py-3">
                  <h3 className="text-sm font-semibold text-[#2b2b2b]">
                    Identity & Intake
                  </h3>
                </div>
                <table className="min-w-full text-sm">
                  <tbody>
                    <InfoRow
                      label="Date of Incident"
                      value={displayValue(form.accident_date)}
                    />
                    <InfoRow label="Date of Birth" value={displayValue(form.dob)} />
                    <InfoRow label="SSN" value={maskedSsn(form.ssn)} />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            <div>
              <h3 className="mb-4 text-sm font-semibold text-[#2b2b2b]">
                Contact Details
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Full Name
                  </label>
                  <input
                    value={form.client_name}
                    onChange={(e) => updateField("client_name", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Phone
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Language Preference
                  </label>
                  <div className="flex overflow-hidden rounded-md border border-[#d9d9d9]">
                    <button
                      type="button"
                      onClick={() => updateField("preferred_language", "en")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        form.preferred_language !== 'es'
                          ? 'bg-[#4b0a06] text-white'
                          : 'bg-white text-[#2b2b2b] hover:bg-[#f7f7f7]'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("preferred_language", "es")}
                      className={`flex-1 border-l border-[#d9d9d9] py-2 text-sm font-medium transition-colors ${
                        form.preferred_language === 'es'
                          ? 'bg-[#4b0a06] text-white'
                          : 'bg-white text-[#2b2b2b] hover:bg-[#f7f7f7]'
                      }`}
                    >
                      Español
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold text-[#2b2b2b]">
                Identity & Intake
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
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => updateField("dob", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    SSN
                  </label>
                  <input
                    value={form.ssn}
                    onChange={(e) => updateField("ssn", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                    placeholder="XXX-XX-XXXX"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold text-[#2b2b2b]">
                Address
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Address Line 1
                  </label>
                  <input
                    value={form.address_line_1}
                    onChange={(e) =>
                      updateField("address_line_1", e.target.value)
                    }
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#2b2b2b]">
                    Address Line 2
                  </label>
                  <input
                    value={form.address_line_2}
                    onChange={(e) =>
                      updateField("address_line_2", e.target.value)
                    }
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
                    ZIP
                  </label>
                  <input
                    value={form.zip}
                    onChange={(e) => updateField("zip", e.target.value)}
                    className="w-full rounded-md border border-[#d9d9d9] px-4 py-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}