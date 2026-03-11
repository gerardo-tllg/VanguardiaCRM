import CaseHeader from "../../../components/CaseHeader";
import CaseSidebar from "../../../components/CaseSidebar";
import CaseNotesPanel from "../../../components/CaseNotesPanel";

export default function CaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mockCase = {
    id: "case0001",
    clientName: "Reyna Vazquez",
    dateOfIncident: "01/29/2026",
    caseType: "Slip / Fall",
    status: "Treating",
    phone: "(956) 325-3075",
    email: "reynavazquez06@icloud.com",
    assignedTo: "S. Salas",
    office: "TX",
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <CaseHeader caseData={mockCase} />

      <div className="flex flex-1 gap-6 p-6">
        <CaseSidebar caseId={mockCase.id} />
        <main className="min-w-0 flex-1">{children}</main>
        <CaseNotesPanel />
      </div>
    </div>
  );
}