import DefendantsTab from "@/components/case/DefendantsTab";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseDefendantsPage({ params }: PageProps) {
  const { caseId } = await params;
  return <DefendantsTab caseId={caseId} />;
}
