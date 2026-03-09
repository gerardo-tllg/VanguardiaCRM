"use client";

import { useMemo, useState } from "react";

type LeadStatus =
  | "New Intake"
  | "Under Review"
  | "Accepted"
  | "Rejected"
  | "Converted to Case"
  | "Archived";

type IntakeLead = {
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
};

const initialLeads: IntakeLead[] = [
  {
    id: "lead_001",
    clientName: "Carlos Cortez",
    phone: "9566847014",
    email: "",
    source: "Direct Website",
    priority: "Medium",
    score: 70,
    caseType: "Premises Liability",
    dateOfIncident: "Last week / Mold issue began 3 months ago",
    location: "La Estancia Apartments, Mercedes, Texas",
    defendant: "La Estancia Apartments",
    injuries: ["Pneumonia", "Difficulty breathing", "Pregnant spouse affected"],
    treatment: "Emergency Room, Ongoing Treatment",
    aiSummary:
      "Mold exposure case involving pneumonia and breathing issues for client and 37-week pregnant wife after inadequate landlord remediation.",
    aiRecommendation: "Accept",
    strategyMemo:
      "Strong premises liability case. Client reports notice to landlord, inadequate remediation, documented mold conditions, emergency treatment, and ongoing respiratory harm affecting both client and pregnant spouse.",
    evidenceFiles: ["IMG_2564.png", "IMG_2563.png"],
    status: "New Intake",
    submittedAt: "03/05/2026 10:14 AM",
  },
  {
    id: "lead_002",
    clientName: "Angela Flores",
    phone: "9565558744",
    email: "angelaflores@email.com",
    source: "AI Intake",
    priority: "High",
    score: 82,
    caseType: "Motor Vehicle Accident",
    dateOfIncident: "03/01/2026",
    location: "McAllen, Texas",
    defendant: "Unknown at intake",
    injuries: ["Neck pain", "Back pain", "Headaches"],
    treatment: "ER visit, chiropractic follow-up",
    aiSummary:
      "Rear-end collision with ongoing neck and back complaints. Early treatment started.",
    aiRecommendation: "Accept",
    strategyMemo:
      "Likely viable MVA claim. Need police report, insurance information, and treatment progression.",
    evidenceFiles: ["crash_photo_1.jpg"],
    status: "Under Review",
    submittedAt: "03/08/2026 2:03 PM",
  },
  {
    id: "lead_003",
    clientName: "Daniel Reyes",
    phone: "9565556602",
    email: "danielreyes@email.com",
    source: "Referral",
    priority: "Low",
    score: 41,
    caseType: "Personal Injury",
    dateOfIncident: "12/15/2023",
    location: "Edinburg, Texas",
    defendant: "Unknown",
    injuries: ["Minor soft tissue complaints"],
    treatment: "Minimal treatment",
    aiSummary:
      "Older claim with minimal treatment and weaker damages profile.",
    aiRecommendation: "Reject",
    strategyMemo:
      "Low-value claim with potential timing concerns and limited medical support.",
    evidenceFiles: [],
    status: "Rejected",
    submittedAt: "03/07/2026 11:21 AM",
  },
];

function getPriorityStyles(priority: IntakeLead["priority"]) {
  switch (priority) {
    case "High":
      return "bg-[#ecf8f1] text-[#1f7a4d] border border-[#b9e4cf]";
    case "Medium":
      return "bg-[#f3e7e5] text-[#4b0a06] border border-[#e4c9c4]";
    case "Low":
      return "bg-[#f3f3f3] text-[#6b6b6b] border border-[#dddddd]";
    default:
      return "bg-[#f8f8f8] text-[#444444] border border-[#e5e5e5]";
  }
}

function getStatusStyles(status: LeadStatus) {
  switch (status) {
    case "New Intake":
      return "bg-[#f3e7e5] text-[#4b0a06] border border-[#e4c9c4]";
    case "Under Review":
      return "bg-[#fff7e8] text-[#8a5a00] border border-[#f1d9a6]";
    case "Accepted":
      return "bg-[#ecf8f1] text-[#1f7a4d] border border-[#b9e4cf]";
    case "Rejected":
      return "bg-[#f3f3f3] text-[#6b6b6b] border border-[#dddddd]";
    case "Converted to Case":
      return "bg-[#e7f7ee] text-[#16643f] border border-[#a9d9c0]";
    case "Archived":
      return "bg-[#f3f3f3] text-[#8a8a8a] border border-[#dddddd]";
    default:
      return "bg-[#f8f8f8] text-[#444444] border border-[#e5e5e5]";
  }
}

export default function LeadsWorkspace() {
  const [leads, setLeads] = useState<IntakeLead[]>(initialLeads);
  const [selectedId, setSelectedId] = useState<string>(initialLeads[0]?.id ?? "");
  const [search, setSearch] = useState("");

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;

    return leads.filter((lead) => {
      return (
        lead.clientName.toLowerCase().includes(q) ||
        lead.caseType.toLowerCase().includes(q) ||
        lead.source.toLowerCase().includes(q) ||
        lead.location.toLowerCase().includes(q)
      );
    });
  }, [leads, search]);

  const selectedLead =
    filteredLeads.find((lead) => lead.id === selectedId) ??
    filteredLeads[0] ??
    null;

  function updateLeadStatus(id: string, status: LeadStatus) {
    setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, status } : lead)));
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-5 rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
        <div className="border-b border-[#e5e5e5] p-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[#2b2b2b]">Intake Queue</h2>
            <input
              type="text"
              placeholder="Search leads"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-55 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-sm text-[#2b2b2b] placeholder:text-[#8a8a8a] outline-none focus:border-[#4b0a06]"
            />
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto">
          {filteredLeads.map((lead) => {
            const isSelected = selectedLead?.id === lead.id;

            return (
              <button
                key={lead.id}
                onClick={() => setSelectedId(lead.id)}
                className={[
                  "w-full text-left border-b border-[#eeeeee] p-4 transition",
                  isSelected
                    ? "bg-[#fcf8f7]"
                    : "bg-white hover:bg-[#fcfaf9]",
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

          {filteredLeads.length === 0 && (
            <div className="p-6 text-sm text-[#6b6b6b]">No leads found.</div>
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
              <button
                onClick={() => updateLeadStatus(selectedLead.id, "Accepted")}
                className="rounded-md bg-[#1f7a4d] px-4 py-2 text-sm font-medium text-white hover:bg-[#256f4a]"
              >
                Accept Case
              </button>

              <button
                onClick={() => updateLeadStatus(selectedLead.id, "Rejected")}
                className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
              >
                Reject Case
              </button>

              <button
                onClick={() => updateLeadStatus(selectedLead.id, "Converted to Case")}
                className="rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08]"
              >
                Convert to Case
              </button>

              <button
                onClick={() => updateLeadStatus(selectedLead.id, "Archived")}
                className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#6b6b6b] hover:bg-[#f7f7f7]"
              >
                Archive
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-4">
                <h3 className="text-sm font-semibold text-[#2b2b2b]">Client Information</h3>
                <div className="mt-3 space-y-2 text-sm text-[#444444]">
                  <div><span className="font-medium text-[#2b2b2b]">Name:</span> {selectedLead.clientName}</div>
                  <div><span className="font-medium text-[#2b2b2b]">Phone:</span> {selectedLead.phone}</div>
                  <div><span className="font-medium text-[#2b2b2b]">Email:</span> {selectedLead.email || "N/A"}</div>
                  <div><span className="font-medium text-[#2b2b2b]">Submitted:</span> {selectedLead.submittedAt}</div>
                </div>
              </div>

              <div className="rounded-lg border border-[#e5e5e5] bg-[#fcfcfc] p-4">
                <h3 className="text-sm font-semibold text-[#2b2b2b]">Incident Details</h3>
                <div className="mt-3 space-y-2 text-sm text-[#444444]">
                  <div><span className="font-medium text-[#2b2b2b]">Date of Incident:</span> {selectedLead.dateOfIncident}</div>
                  <div><span className="font-medium text-[#2b2b2b]">Location:</span> {selectedLead.location}</div>
                  <div><span className="font-medium text-[#2b2b2b]">Defendant:</span> {selectedLead.defendant}</div>
                  <div><span className="font-medium text-[#2b2b2b]">Treatment:</span> {selectedLead.treatment}</div>
                </div>
              </div>
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
                <h3 className="text-sm font-semibold text-[#2b2b2b]">AI Strategy Memo</h3>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    selectedLead.aiRecommendation === "Accept"
                      ? "bg-[#ecf8f1] text-[#1f7a4d] border border-[#b9e4cf]"
                      : "bg-[#f3f3f3] text-[#6b6b6b] border border-[#dddddd]"
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
              <h3 className="text-sm font-semibold text-[#2b2b2b]">Evidence Files</h3>

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
          <div className="p-6 text-sm text-[#6b6b6b]">Select a lead to review.</div>
        )}
      </div>
    </div>
  );
}