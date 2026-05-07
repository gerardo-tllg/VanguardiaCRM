import DemandLetterTab from "@/components/case/DemandLetterTab";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseDemandLetterPage({ params }: PageProps) {
  const { caseId } = await params;
  return <DemandLetterTab caseId={caseId} />;
}
