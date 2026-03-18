"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Provider = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  specialty: string | null;
  provider_type?: string | null;
  address_line_1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

type Financial = {
  original_bill: number | null;
  paid_plus_owed: number | null;
};

type CaseProvider = {
  id: string;
  provider_id: string;
  treatment_description: string | null;
  treatment_status: string | null;
  records_status: string | null;
  billing_status: string | null;
  signed_lop: boolean;
  lien_filed: boolean;
  account_number: string | null;
  providers: Provider | Provider[] | null;
  case_provider_financials: Financial[] | null;
};

type Props = {
  caseNumber: string;
  initialCaseProviders: CaseProvider[];
};

type CaseProviderEditForm = {
  treatment_description: string;
  treatment_status: string;
  records_status: string;
  billing_status: string;
  signed_lop: boolean;
  lien_filed: boolean;
  account_number: string;
  original_bill: string;
  paid_plus_owed: string;
};

const EMPTY_FORM: CaseProviderEditForm = {
  treatment_description: "",
  treatment_status: "",
  records_status: "",
  billing_status: "",
  signed_lop: false,
  lien_filed: false,
  account_number: "",
  original_bill: "",
  paid_plus_owed: "",
};

function getProvider(
  providerValue: CaseProvider["providers"]
): Provider | null {
  if (!providerValue) return null;
  return Array.isArray(providerValue) ? providerValue[0] ?? null : providerValue;
}

function getFinancial(
  financialValue: CaseProvider["case_provider_financials"]
): Financial | null {
  if (!financialValue || financialValue.length === 0) return null;
  return financialValue[0];
}

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value ?? 0);
}

export default function CaseMedicalProvidersTab({
  initialCaseProviders,
}: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CaseProviderEditForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function startEditing(item: CaseProvider) {
    const financial = getFinancial(item.case_provider_financials);

    setEditingId(item.id);
    setForm({
      treatment_description: item.treatment_description ?? "",
      treatment_status: item.treatment_status ?? "",
      records_status: item.records_status ?? "",
      billing_status: item.billing_status ?? "",
      signed_lop: item.signed_lop ?? false,
      lien_filed: item.lien_filed ?? false,
      account_number: item.account_number ?? "",
      original_bill:
        financial?.original_bill !== null && financial?.original_bill !== undefined
          ? String(financial.original_bill)
          : "",
      paid_plus_owed:
        financial?.paid_plus_owed !== null && financial?.paid_plus_owed !== undefined
          ? String(financial.paid_plus_owed)
          : "",
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function save(caseProviderId: string) {
    try {
      setSaving(true);

      const res = await fetch(`/api/case-providers/${caseProviderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data: { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save case provider");
      }

      setEditingId(null);
      setForm(EMPTY_FORM);
      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to save case provider"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {initialCaseProviders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#d9d9d9] bg-white p-6 text-sm text-[#666666]">
          No providers linked to this case yet.
        </div>
      ) : (
        initialCaseProviders.map((item) => {
          const provider = getProvider(item.providers);
          const financial = getFinancial(item.case_provider_financials);

          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-lg border border-[#e5e5e5] bg-white"
            >
              <div className="flex items-center justify-between bg-[#f6f6f6] px-4 py-3">
                <div>
                  <div className="text-base font-semibold text-[#2b2b2b]">
                    {provider?.name ?? "Unknown Provider"}
                  </div>
                  <div className="mt-1 text-sm text-[#666666]">
                    {provider?.specialty ?? "No specialty"} •{" "}
                    {provider?.phone ?? "No phone"}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-[#2b2b2b]">
                    {formatMoney(financial?.original_bill)}
                  </div>

                  {editingId === item.id ? (
                    <>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="rounded-md border border-[#d9d9d9] bg-white px-3 py-1.5 text-sm text-[#2b2b2b]"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => save(item.id)}
                        className="rounded-md bg-[#4b0a06] px-3 py-1.5 text-sm text-white"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditing(item)}
                      className="rounded-md bg-[#4b0a06] px-3 py-1.5 text-sm text-white"
                    >
                      Edit Case Details
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 p-4 lg:grid-cols-3">
                <div>
                  <div className="mb-3 text-sm font-semibold text-[#2b2b2b]">
                    Contact
                  </div>
                  <div className="space-y-2 text-sm text-[#444444]">
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      {provider?.email ?? "—"}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>{" "}
                      {provider?.provider_type ?? "—"}
                    </div>
                    <div>
                      <span className="font-medium">Address:</span>{" "}
                      {[
                        provider?.address_line_1,
                        provider?.city,
                        provider?.state,
                        provider?.zip,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-sm font-semibold text-[#2b2b2b]">
                    Treatment
                  </div>

                  {editingId === item.id ? (
                    <div className="space-y-3">
                      <input
                        value={form.treatment_description}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            treatment_description: e.target.value,
                          }))
                        }
                        placeholder="Treatment description"
                        className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
                      />
                      <input
                        value={form.treatment_status}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            treatment_status: e.target.value,
                          }))
                        }
                        placeholder="Treatment status"
                        className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
                      />
                      <input
                        value={form.records_status}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            records_status: e.target.value,
                          }))
                        }
                        placeholder="Records status"
                        className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm text-[#444444]">
                      <div>
                        <span className="font-medium">Description:</span>{" "}
                        {item.treatment_description ?? "—"}
                      </div>
                      <div>
                        <span className="font-medium">Treatment Status:</span>{" "}
                        {item.treatment_status ?? "—"}
                      </div>
                      <div>
                        <span className="font-medium">Records Status:</span>{" "}
                        {item.records_status ?? "—"}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-3 text-sm font-semibold text-[#2b2b2b]">
                    Billing / Case Info
                  </div>

                  {editingId === item.id ? (
                    <div className="space-y-3">
                      <input
                        value={form.billing_status}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            billing_status: e.target.value,
                          }))
                        }
                        placeholder="Billing status"
                        className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
                      />
                      <input
                        value={form.account_number}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            account_number: e.target.value,
                          }))
                        }
                        placeholder="Account number"
                        className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
                      />
                      <input
                        value={form.original_bill}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            original_bill: e.target.value,
                          }))
                        }
                        placeholder="Original bill"
                        className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
                      />
                      <input
                        value={form.paid_plus_owed}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            paid_plus_owed: e.target.value,
                          }))
                        }
                        placeholder="Paid + owed"
                        className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
                      />

                      <label className="flex items-center gap-2 text-sm text-[#2b2b2b]">
                        <input
                          type="checkbox"
                          checked={form.signed_lop}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              signed_lop: e.target.checked,
                            }))
                          }
                        />
                        Signed LOP
                      </label>

                      <label className="flex items-center gap-2 text-sm text-[#2b2b2b]">
                        <input
                          type="checkbox"
                          checked={form.lien_filed}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              lien_filed: e.target.checked,
                            }))
                          }
                        />
                        Lien Filed
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm text-[#444444]">
                      <div>
                        <span className="font-medium">Billing Status:</span>{" "}
                        {item.billing_status ?? "—"}
                      </div>
                      <div>
                        <span className="font-medium">Account #:</span>{" "}
                        {item.account_number ?? "—"}
                      </div>
                      <div>
                        <span className="font-medium">Original Bill:</span>{" "}
                        {formatMoney(financial?.original_bill)}
                      </div>
                      <div>
                        <span className="font-medium">Paid + Owed:</span>{" "}
                        {formatMoney(financial?.paid_plus_owed)}
                      </div>
                      <div>
                        <span className="font-medium">Signed LOP:</span>{" "}
                        {item.signed_lop ? "Yes" : "No"}
                      </div>
                      <div>
                        <span className="font-medium">Lien Filed:</span>{" "}
                        {item.lien_filed ? "Yes" : "No"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}