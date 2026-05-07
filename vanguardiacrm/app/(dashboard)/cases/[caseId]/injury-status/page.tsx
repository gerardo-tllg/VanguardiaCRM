import InjuryStatusTab from "@/components/case/InjuryStatusTab";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseInjuryStatusPage({ params }: PageProps) {
  const { caseId } = await params;
  return <InjuryStatusTab caseId={caseId} />;
}
