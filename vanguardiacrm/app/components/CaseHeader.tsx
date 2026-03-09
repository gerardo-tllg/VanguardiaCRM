import Link from "next/link";

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

export default function CaseHeader({ caseData }: CaseHeaderProps) {
  return (
    <header className="border-b border-[#e5e5e5] bg-white px-6 py-5">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link
              href="/projects"
              className="rounded-md border border-[#e5e5e5] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
            >
              Back to Projects
            </Link>

            <div>
              <h1 className="text-3xl font-bold text-[#2b2b2b]">
                {caseData.clientName} - DOI {caseData.dateOfIncident}
              </h1>

              <p className="mt-2 text-sm text-[#6b6b6b]">
                {caseData.phone} | {caseData.email} | {caseData.caseType} |{" "}
                {caseData.office} | {caseData.assignedTo}
              </p>
            </div>
          </div>

          <div className="rounded-full border border-[#b9e4cf] bg-[#ecf8f1] px-4 py-2 text-sm font-medium text-[#1f7a4d]">
            {caseData.status}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#6b6b6b]">
              Search Other Cases
            </label>
            <input
              type="text"
              placeholder="Search other cases by client, DOI, or case type"
              className="w-full rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm text-[#2b2b2b] placeholder:text-[#8a8a8a] outline-none focus:border-[#4b0a06]"
            />
          </div>

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