"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type LeadStatus =
  | "New Intake"
  | "Under Review"
  | "Accepted"
  | "Rejected"
  | "Converted to Case"
  | "Archived";

export type IntakeLead = {
  id: string;
  clientName: string;
  phone: string;
  email?: string;
  source: string;
  priority: "Low" | "Medium" | "High";
  score: number;
  caseType: string;
  dateOfIncident: string;
  location: string;
  defendant: string;
  injuries: string[];
  treatment: string;
  aiSummary: string;
  aiRecommendation: "Accept" | "Reject";
  strategyMemo: string;
  evidenceFiles: string[];
  status: LeadStatus;
  submittedAt: string;
  lang?: string;
  utmSource?: string;
  utmCampaign?: string;
  incidentDescription?: string;
};

type LeadTab = "active" | "converted" | "archived";

function getPriorityStyles(priority: IntakeLead["priority"]) {
  switch (priority) {
    case "High":
      return "border border-[#b9e4cf] bg-[#ecf8f1] text-[#1f7a4d]";
    case "Medium":
      return "border border-[#e4c9c4] bg-[#f3e7e5] text-[#4b0a06]";
    case "Low":
      return "border border-[#dddddd] bg-[#f3f3f3] text-[#6b6b6b]";
    default:
      return "border border-[#e5e5e5] bg-[#f8f8f8] text-[#444444]";
  }
}

function getStatusStyles(status: LeadStatus) {
  switch (status) {
    case "New Intake":
      return "border border-[#e4c9c4] bg-[#f3e7e5] text-[#4b0a06]";
    case "Under Review":
      return "border border-[#f1d9a6] bg-[#fff7e8] text-[#8a5a00]";
    case "Accepted":
      return "border border-[#b9e4cf] bg-[#ecf8f1] text-[#1f7a4d]";
    case "Rejected":
      return "border border-[#dddddd] bg-[#f3f3f3] text-[#6b6b6b]";
    case "Converted to Case":
      return "border border-[#a9d9c0] bg-[#e7f7ee] text-[#16643f]";
    case "Archived":
      return "border border-[#dddddd] bg-[#f3f3f3] text-[#8a8a8a]";
    default:
      return "border border-[#e5e5e5] bg-[#f8f8f8] text-[#444444]";
  }
}

function uiStatusToDbStatus(
  status: LeadStatus
): "New" | "Reviewed" | "Accepted" | "Rejected" | "Archived" {
  switch (status) {
    case "New Intake":
      return "New";
    case "Under Review":
      return "Reviewed";
    case "Accepted":
      return "Accepted";
    case "Rejected":
      return "Rejected";
    case "Archived":
      return "Archived";
    case "Converted to Case":
      return "Accepted";
    default:
      return "New";
  }
}

function getTabLabel(tab: LeadTab) {
  switch (tab) {
    case "active":
      return "Active Leads";
    case "converted":
      return "Converted";
    case "archived":
      return "Archived";
    default:
      return "Active Leads";
  }
}

export default function LeadsWorkspace({
  initialLeads,
}: {
  initialLeads: IntakeLead[];
}) {
  const [leads, setLeads] = useState<IntakeLead[]>(initialLeads);
  const [selectedId, setSelectedId] = useState<string>(initialLeads[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LeadTab>("active");

  const visibleLeads = useMemo(() => {
    const q = search.trim().toLowerCase();

    const searched = !q
      ? leads
      : leads.filter((lead) => {
          return (
            lead.clientName.toLowerCase().includes(q) ||
            lead.caseType.toLowerCase().includes(q) ||
            lead.source.toLowerCase().includes(q) ||
            lead.location.toLowerCase().includes(q) ||
            (lead.incidentDescription ?? "").toLowerCase().includes(q)
          );
        });

    if (activeTab === "active") {
      return searched.filter(
        (lead) =>
          lead.status !== "Converted to Case" && lead.status !== "Archived"
      );
    }

    if (activeTab === "converted") {
      return searched.filter((lead) => lead.status === "Converted to Case");
    }

    return searched.filter((lead) => lead.status === "Archived");
  }, [leads, search, activeTab]);

  useEffect(() => {
    if (!visibleLeads.some((lead) => lead.id === selectedId)) {
      setSelectedId(visibleLeads[0]?.id ?? "");
    }
  }, [visibleLeads, selectedId]);

  const selectedLead =
    visibleLeads.find((lead) => lead.id === selectedId) ?? visibleLeads[0] ?? null;

  const counts = useMemo(() => {
    return {
      active: leads.filter(
        (lead) => lead.status !== "Converted to Case" && lead.status !== "Archived"
      ).length,
      converted: leads.filter((lead) => lead.status === "Converted to Case").length,
      archived: leads.filter((lead) => lead.status === "Archived").length,
    };
  }, [leads]);

  async function updateLeadStatus(id: string, status: LeadStatus) {
    const previous = leads;

    setSavingStatus(id);

    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, status } : lead))
    );

    try {
      const res = await fetch(`/api/leads/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: uiStatusToDbStatus(status),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("Lead status update failed:", result);
        throw new Error(result?.error || "Failed to update lead status");
      }
    } catch (error) {
      console.error(error);
      setLeads(previous);
      alert(
        error instanceof Error ? error.message : "Failed to update lead status."
      );
    } finally {
      setSavingStatus(null);
    }
  }

  async function convertLeadToCase(id: string) {
    setSavingStatus(id);

    try {
      const res = await fetch(`/api/leads/${id}/convert`, {
        method: "POST",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to convert lead to case");
      }

      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === id ? { ...lead, status: "Converted to Case" } : lead
        )
      );

      if (result?.redirectTo) {
        window.location.href = result.redirectTo;
        return;
      }
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to convert lead to case"
      );
    } finally {
      setSavingStatus(null);
    }
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-5 overflow-hidden rounded-xl border border-[#e5e5e5] bg-white">
        <div className="border-b border-[#e5e5e5] p-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[#2b2b2b]">
              {getTabLabel(activeTab)}
            </h2>
            <input
              type="text"
              placeholder="Search leads"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-55 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-sm text-[#2b2b2b] placeholder:text-[#8a8a8a] outline-none focus:border-[#4b0a06]"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                activeTab === "active"
                  ? "border border-[#e4c9c4] bg-[#fdf6f5] text-[#4b0a06]"
                  : "border border-[#e5e5e5] bg-white text-[#555555]"
              }`}
            >
              Active ({counts.active})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("converted")}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                activeTab === "converted"
                  ? "border border-[#a9d9c0] bg-[#e7f7ee] text-[#16643f]"
                  : "border border-[#e5e5e5] bg-white text-[#555555]"
              }`}
            >
              Converted ({counts.converted})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("archived")}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                activeTab === "archived"
                  ? "border border-[#dddddd] bg-[#f3f3f3] text-[#6b6b6b]"
                  : "border border-[#e5e5e5] bg-white text-[#555555]"
              }`}
            >
              Archived ({counts.archived})
            </button>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto">
          {visibleLeads.map((lead) => {
            const isSelected = selectedLead?.id === lead.id;

            return (
              <button
                key={lead.id}
                onClick={() => setSelectedId(lead.id)}
                className={[
                  "w-full border-b border-[#eeeeee] p-4 text-left transition",
                  isSelected ? "bg-[#fcf8f7]" : "bg-white hover:bg-[#fcfaf9]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b2b2b]">
                      {lead.clientName}
                    </div>
                    <div className="mt-1 text-xs text-[#6b6b6b]">
                      {lead.caseType}
                    </div>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityStyles(
                      lead.priority
                    )}`}
                  >
                    {lead.priority} · {lead.score}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#555555]">
                  <div>
                    <span className="font-medium text-[#2b2b2b]">DOI:</span>{" "}
                    {lead.dateOfIncident}
                  </div>
                  <div>
                    <span className="font-medium text-[#2b2b2b]">Source:</span>{" "}
                    {lead.source}
                  </div>
                  <div>
                    <span className="font-medium text-[#2b2b2b]">Phone:</span>{" "}
                    {lead.phone}
                  </div>
                  <div>
                    <span className="font-medium text-[#2b2b2b]">Status:</span>{" "}
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusStyles(
                        lead.status
                      )}`}
                    >
                      {lead.status}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {visibleLeads.length === 0 && (
            <div className="p-6 text-sm text-[#6b6b6b]">
              No leads found in this section.
            </div>
          )}
        </div>
      </div>

      <div className="col-span-7 rounded-xl border border-[#e5e5e5] bg-white">
        {selectedLead ? (
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 border-b border-[#eeeeee] pb-5">
              <div>
                <h2 className="text-2xl font-bold text-[#2b2b2b]">
                  {selectedLead.clientName}
                </h2>
                <p className="mt-2 text-sm text-[#6b6b6b]">
                  {selectedLead.caseType} · {selectedLead.source}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getPriorityStyles(
                    selectedLead.priority
                  )}`}
                >
                  Priority: {selectedLead.priority} ({selectedLead.score}/100)
                </span>

                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusStyles(
                    selectedLead.status
                  )}`}
                >
                  {selectedLead.status}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/leads/${selectedLead.id}`}
                className="rounded-md border border-[#e4c9c4] bg-[#fdf6f5] px-4 py-2 text-sm font-medium text-[#4b0a06] hover:bg-[#f8eeee]"
              >
                View Lead
              </Link>

              {activeTab === "active" && (
                <>
                  <button
                    disabled={savingStatus === selectedLead.id}
                    onClick={() =>
                      updateLeadStatus(selectedLead.id, "Under Review")
                    }
                    className="rounded-md border border-[#f1d9a6] bg-[#fff7e8] px-4 py-2 text-sm font-medium text-[#8a5a00] hover:bg-[#fdf2d8] disabled:opacity-50"
                  >
                    Mark Under Review
                  </button>

                  <button
                    disabled={savingStatus === selectedLead.id}
                    onClick={() => updateLeadStatus(selectedLead.id, "Rejected")}
                    className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7] disabled:opacity-50"
                  >
                    Reject
                  </button>

                  <button
                    disabled={savingStatus === selectedLead.id}
                    onClick={() => convertLeadToCase(selectedLead.id)}
                    className="rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08] disabled:opacity-50"
                  >
                    Convert to Case
                  </button>

                  <button
                    disabled={savingStatus === selectedLead.id}
                    onClick={() => updateLeadStatus(selectedLead.id, "Archived")}
                    className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#6b6b6b] hover:bg-[#f7f7f7] disabled:opacity-50"
                  >
                    Archive
                  </button>
                </>
              )}

              {activeTab === "converted" && (
                <button
                  disabled
                  className="rounded-md border border-[#a9d9c0] bg-[#e7f7ee] px-4 py-2 text-sm font-medium text-[#16643f]"
                >
                  Converted to Case
                </button>
              )}

              {activeTab === "archived" && (
                <button
                  disabled={savingStatus === selectedLead.id}
                  onClick={() => updateLeadStatus(selectedLead.id, "Under Review")}
                  className="rounded-md border border-[#f1d9a6] bg-[#fff7e8] px-4 py-2 text-sm font-medium text-[#8a5a00] hover:bg-[#fdf2d8] disabled:opacity-50"
                >
                  Restore to Under Review
                </button>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-4">
                <h3 className="text-sm font-semibold text-[#2b2b2b]">
                  Client Information
                </h3>
                <div className="mt-3 space-y-2 text-sm text-[#444444]">
                  <div>
                    <span className="font-medium text-[#2b2b2b]">Name:</span>{" "}
                    {selectedLead.clientName}
                  </div>
                  <div>
                    <span className="font-medium text-[#2b2b2b]">Phone:</span>{" "}
                    {selectedLead.phone}
                  </div>
                  <div>
                    <span className="font-medium text-[#2b2b2b]">Email:</span>{" "}
                    {selectedLead.email || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium text-[#2b2b2b]">Submitted:</span>{" "}
                    {selectedLead.submittedAt}
                  </div>
                  <div>
                    <span className="font-medium text-[#2b2b2b]">Language:</span>{" "}
                    {selectedLead.lang || "N/A"}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-4">
                <h3 className="text-sm font-semibold text-[#2b2b2b]">
                  Incident Details
                </h3>
                <div className="mt-3 space-y-2 text-sm text-[#444444]">
                  <div>
                    <span className="font-medium text-[#2b2b2b]">
                      Date of Incident:
                    </span>{" "}
                    {selectedLead.dateOfIncident}
                  </div>
                  <div>
                    <span className="font-medium text-[#2b2b2b]">Location:</span>{" "}
                    {selectedLead.location}
                  </div>
                  <div>
                    <span className="font-medium text-[#2b2b2b]">Defendant:</span>{" "}
                    {selectedLead.defendant}
                  </div>
                  <div>
                    <span className="font-medium text-[#2b2b2b]">Treatment:</span>{" "}
                    {selectedLead.treatment}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-4">
              <h3 className="text-sm font-semibold text-[#2b2b2b]">
                Incident Description
              </h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#444444]">
                {selectedLead.incidentDescription || "No incident description available."}
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-4">
              <h3 className="text-sm font-semibold text-[#2b2b2b]">Injuries</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedLead.injuries.map((injury) => (
                  <span
                    key={injury}
                    className="inline-flex rounded-full border border-[#e5e5e5] bg-white px-3 py-1 text-xs text-[#444444]"
                  >
                    {injury}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-4">
              <h3 className="text-sm font-semibold text-[#2b2b2b]">AI Summary</h3>
              <p className="mt-3 text-sm leading-6 text-[#444444]">
                {selectedLead.aiSummary}
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[#2b2b2b]">
                  AI Strategy Memo
                </h3>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    selectedLead.aiRecommendation === "Accept"
                      ? "border border-[#b9e4cf] bg-[#ecf8f1] text-[#1f7a4d]"
                      : "border border-[#dddddd] bg-[#f3f3f3] text-[#6b6b6b]"
                  }`}
                >
                  Recommendation: {selectedLead.aiRecommendation}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#444444]">
                {selectedLead.strategyMemo}
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-4">
              <h3 className="text-sm font-semibold text-[#2b2b2b]">
                Attribution
              </h3>
              <div className="mt-3 space-y-2 text-sm text-[#444444]">
                <div>
                  <span className="font-medium text-[#2b2b2b]">UTM Source:</span>{" "}
                  {selectedLead.utmSource || "N/A"}
                </div>
                <div>
                  <span className="font-medium text-[#2b2b2b]">UTM Campaign:</span>{" "}
                  {selectedLead.utmCampaign || "N/A"}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-4">
              <h3 className="text-sm font-semibold text-[#2b2b2b]">
                Evidence Files
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {selectedLead.evidenceFiles.length > 0 ? (
                  selectedLead.evidenceFiles.map((file) => (
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
        ) : (
          <div className="p-6 text-sm text-[#6b6b6b]">
            Select a lead to review.
          </div>
        )}
      </div>
    </div>
  );
}