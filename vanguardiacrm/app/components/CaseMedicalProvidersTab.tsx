"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProviderDirectoryItem = {
  id: string;
  name: string;
  provider_type: string | null;
  specialty: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  website: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  billing_contact_name: string | null;
  billing_contact_email: string | null;
  billing_contact_phone: string | null;
  notes: string | null;
};

type FinancialItem = {
  id: string;
  original_bill: number | null;
  adjusted_bill: number | null;
  client_paid: number | null;
  medpay_pip_paid: number | null;
  insurance_paid: number | null;
  still_owed: number | null;
  paid_plus_owed: number | null;
  records_requested_date: string | null;
  records_received_date: string | null;
  bills_requested_date: string | null;
  bills_received_date: string | null;
  lien_notes: string | null;
  insurance_notes: string | null;
};

type CaseProviderItem = {
  id: string;
  case_id: string;
  provider_id: string;
  treatment_description: string | null;
  treatment_status: string | null;
  first_visit_date: string | null;
  last_visit_date: string | null;
  visit_count: number | null;
  account_number: string | null;
  records_status: string | null;
  billing_status: string | null;
  signed_lop: boolean;
  lien_filed: boolean;
  case_notes: string | null;
  providers: ProviderDirectoryItem | ProviderDirectoryItem[] | null;
  case_provider_financials: FinancialItem[] | null;
};

type Props = {
  caseNumber: string;
  initialCaseProviders: CaseProviderItem[];
  providerDirectory: ProviderDirectoryItem[];
};

type NewProviderForm = {
  name: string;
  provider_type: string;
  specialty: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  zip: string;
  treatment_description: string;
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

const EMPTY_NEW_PROVIDER: NewProviderForm = {
  name: "",
  provider_type: "",
  specialty: "",
  phone: "",
  fax: "",
  email: "",
  website: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  zip: "",
  treatment_description: "",
};

const EMPTY_CASE_PROVIDER_FORM: CaseProviderEditForm = {
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
  providerValue: CaseProviderItem["providers"]
): ProviderDirectoryItem | null {
  if (!providerValue) return null;
  return Array.isArray(providerValue) ? providerValue[0] ?? null : providerValue;
}

function getFinancial(
  financialValue: CaseProviderItem["case_provider_financials"]
): FinancialItem | null {
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
  caseNumber,
  initialCaseProviders,
  providerDirectory,
}: Props) {
  const router = useRouter();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] =
    useState<CaseProviderEditForm>(EMPTY_CASE_PROVIDER_FORM);

  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<"existing" | "new">("existing");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [providerSearch, setProviderSearch] = useState("");
  const [newProviderForm, setNewProviderForm] =
    useState<NewProviderForm>(EMPTY_NEW_PROVIDER);

  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredDirectory = useMemo(() => {
    const q = providerSearch.trim().toLowerCase();
    if (!q) return providerDirectory;

    return providerDirectory.filter((provider) => {
      return (
        provider.name.toLowerCase().includes(q) ||
        (provider.specialty ?? "").toLowerCase().includes(q) ||
        (provider.city ?? "").toLowerCase().includes(q)
      );
    });
  }, [providerDirectory, providerSearch]);

  function startEditing(item: CaseProviderItem) {
    const financial = getFinancial(item.case_provider_financials);

    setEditingId(item.id);
    setEditForm({
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
    setEditForm(EMPTY_CASE_PROVIDER_FORM);
  }

  async function saveCaseDetails(caseProviderId: string) {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`/api/case-providers/${caseProviderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const data: { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save case provider");
      }

      setEditingId(null);
      setEditForm(EMPTY_CASE_PROVIDER_FORM);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save case provider"
      );
    } finally {
      setSaving(false);
    }
  }

  async function addProviderToCase() {
    try {
      setAdding(true);
      setError(null);

      const payload =
        addMode === "existing"
          ? {
              provider_id: selectedProviderId,
            }
          : {
              ...newProviderForm,
              treatment_status: "Active",
              records_status: "Not Requested",
              billing_status: "Not Requested",
            };

      const res = await fetch(`/api/cases/${caseNumber}/providers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add provider");
      }

      setShowAdd(false);
      setSelectedProviderId("");
      setProviderSearch("");
      setNewProviderForm(EMPTY_NEW_PROVIDER);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add provider");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-[#e5e5e5] bg-white px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-[#2b2b2b]">
            Medical Providers
          </h2>
          <p className="text-sm text-[#666666]">
            Reusable provider contacts linked to this case.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd((prev) => !prev)}
          className="rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white"
        >
          {showAdd ? "Close" : "Add Provider"}
        </button>
      </div>

      {showAdd ? (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setAddMode("existing")}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                addMode === "existing"
                  ? "bg-[#4b0a06] text-white"
                  : "border border-[#d9d9d9] bg-white text-[#2b2b2b]"
              }`}
            >
              Select Existing
            </button>

            <button
              type="button"
              onClick={() => setAddMode("new")}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                addMode === "new"
                  ? "bg-[#4b0a06] text-white"
                  : "border border-[#d9d9d9] bg-white text-[#2b2b2b]"
              }`}
            >
              Create New
            </button>
          </div>

          {addMode === "existing" ? (
            <div className="space-y-3">
              <input
                value={providerSearch}
                onChange={(e) => setProviderSearch(e.target.value)}
                placeholder="Search providers by name, specialty, or city"
                className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
              />

              <select
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
              >
                <option value="">Select a provider</option>
                {filteredDirectory.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                    {provider.specialty ? ` — ${provider.specialty}` : ""}
                    {provider.city ? ` — ${provider.city}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                value={newProviderForm.name}
                onChange={(e) =>
                  setNewProviderForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Provider name"
                className="rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
              />
              <input
                value={newProviderForm.provider_type}
                onChange={(e) =>
                  setNewProviderForm((prev) => ({
                    ...prev,
                    provider_type: e.target.value,
                  }))
                }
                placeholder="Provider type"
                className="rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
              />
              <input
                value={newProviderForm.specialty}
                onChange={(e) =>
                  setNewProviderForm((prev) => ({
                    ...prev,
                    specialty: e.target.value,
                  }))
                }
                placeholder="Specialty"
                className="rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
              />
              <input
                value={newProviderForm.phone}
                onChange={(e) =>
                  setNewProviderForm((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="Phone"
                className="rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
              />
              <input
                value={newProviderForm.email}
                onChange={(e) =>
                  setNewProviderForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="Email"
                className="rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
              />
              <input
                value={newProviderForm.fax}
                onChange={(e) =>
                  setNewProviderForm((prev) => ({
                    ...prev,
                    fax: e.target.value,
                  }))
                }
                placeholder="Fax"
                className="rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
              />
              <input
                value={newProviderForm.address_line_1}
                onChange={(e) =>
                  setNewProviderForm((prev) => ({
                    ...prev,
                    address_line_1: e.target.value,
                  }))
                }
                placeholder="Address line 1"
                className="rounded-md border border-[#d9d9d9] px-3 py-2 text-sm md:col-span-2"
              />
              <input
                value={newProviderForm.city}
                onChange={(e) =>
                  setNewProviderForm((prev) => ({
                    ...prev,
                    city: e.target.value,
                  }))
                }
                placeholder="City"
                className="rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
              />
              <input
                value={newProviderForm.state}
                onChange={(e) =>
                  setNewProviderForm((prev) => ({
                    ...prev,
                    state: e.target.value,
                  }))
                }
                placeholder="State"
                className="rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
              />
              <input
                value={newProviderForm.zip}
                onChange={(e) =>
                  setNewProviderForm((prev) => ({
                    ...prev,
                    zip: e.target.value,
                  }))
                }
                placeholder="ZIP"
                className="rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
              />
              <textarea
                value={newProviderForm.treatment_description}
                onChange={(e) =>
                  setNewProviderForm((prev) => ({
                    ...prev,
                    treatment_description: e.target.value,
                  }))
                }
                placeholder="Initial treatment description"
                rows={4}
                className="rounded-md border border-[#d9d9d9] px-3 py-2 text-sm md:col-span-2"
              />
            </div>
          )}

          <div className="mt-4">
            <button
              type="button"
              onClick={addProviderToCase}
              disabled={adding || (addMode === "existing" && !selectedProviderId)}
              className="rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {adding ? "Saving..." : "Save Provider to Case"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

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
                        onClick={() => saveCaseDetails(item.id)}
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
                        value={editForm.treatment_description}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            treatment_description: e.target.value,
                          }))
                        }
                        placeholder="Treatment description"
                        className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
                      />
                      <input
                        value={editForm.treatment_status}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            treatment_status: e.target.value,
                          }))
                        }
                        placeholder="Treatment status"
                        className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
                      />
                      <input
                        value={editForm.records_status}
                        onChange={(e) =>
                          setEditForm((prev) => ({
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
                        value={editForm.billing_status}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            billing_status: e.target.value,
                          }))
                        }
                        placeholder="Billing status"
                        className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
                      />
                      <input
                        value={editForm.account_number}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            account_number: e.target.value,
                          }))
                        }
                        placeholder="Account number"
                        className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
                      />
                      <input
                        value={editForm.original_bill}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            original_bill: e.target.value,
                          }))
                        }
                        placeholder="Original bill"
                        className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm"
                      />
                      <input
                        value={editForm.paid_plus_owed}
                        onChange={(e) =>
                          setEditForm((prev) => ({
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
                          checked={editForm.signed_lop}
                          onChange={(e) =>
                            setEditForm((prev) => ({
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
                          checked={editForm.lien_filed}
                          onChange={(e) =>
                            setEditForm((prev) => ({
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