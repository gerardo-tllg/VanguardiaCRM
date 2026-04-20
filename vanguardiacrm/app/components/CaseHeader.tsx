"use client";

type CaseHeaderProps = {
  caseData: {
    id: string;
    clientName: string;
    dateOfIncident: string;
    caseType: string;
    status: string;
    phone: string;
    email: string;
    assignedTo: string;
    office: string;
  };
};

const caseStatuses = [
  "Intake",
  "Treating",
  "Demanded",
  "Litigation",
  "Settled",
  "Closed",
];

function getStatusStyles(status: string) {
  switch (status) {
    case "Settled":
    case "Closed":
      return "border-[#b9e4cf] bg-[#ecf8f1] text-[#1f7a4d]";
    case "Litigation":
      return "border-[#dec8f7] bg-[#f8f0ff] text-[#6b2ea6]";
    case "Demanded":
      return "border-[#c9daf7] bg-[#eef4ff] text-[#1d4f91]";
    case "Intake":
      return "border-[#f1d9a6] bg-[#fff7e8] text-[#8a5a00]";
    case "Treating":
    default:
      return "border-[#e4c9c4] bg-[#fdf6f5] text-[#4b0a06]";
  }
}

export default function CaseHeader({ caseData }: CaseHeaderProps) {
  return (
    <header className="border-b border-[#e5e5e5] bg-white px-6 py-5">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-[#2b2b2b]">
              {caseData.clientName} - DOI {caseData.dateOfIncident}
            </h1>

            <p className="mt-2 text-sm text-[#6b6b6b]">
              {caseData.phone} | {caseData.email} | {caseData.caseType} |{" "}
              {caseData.office} | {caseData.assignedTo}
            </p>
          </div>

          <div className="min-w-45">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#6b6b6b]">
              Case Status
            </label>
            <select
              defaultValue={caseData.status}
              className={`w-full rounded-md border px-4 py-2 text-sm font-medium outline-none ${getStatusStyles(
                caseData.status
              )}`}
            >
              {caseStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#6b6b6b]">
              Search This Case
            </label>
            <input
              type="text"
              placeholder="Search notes, documents, treatment, tasks, and more"
              className="w-full rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm text-[#2b2b2b] placeholder:text-[#8a8a8a] outline-none focus:border-[#4b0a06]"
            />
          </div>
        </div>
      </div>
    </header>
  );
}