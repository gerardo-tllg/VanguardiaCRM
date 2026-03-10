import CaseHeader from "../../../../components/CaseHeader";
import CaseSidebar from "../../../../components/CaseSidebar";

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
    <main className="min-h-screen bg-[#f5f5f5] flex">
      <CaseSidebar caseId={mockCase.id} />

      <div className="flex-1 flex flex-col">
        <CaseHeader caseData={mockCase} />
        <div className="p-6">{children}</div>
      </div>
    </main>
  );
}