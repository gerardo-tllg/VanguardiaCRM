import SettlementWorksheetTab from "@/components/case/SettlementWorksheet";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseSettlementPage({ params }: PageProps) {
  const { caseId } = await params;
  return <SettlementWorksheetTab caseId={caseId} />;
}
