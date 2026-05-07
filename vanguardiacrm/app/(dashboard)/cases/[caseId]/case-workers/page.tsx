import CaseWorkersPanel from "@/components/case/CaseWorkersPanel";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseWorkersPage({ params }: PageProps) {
  const { caseId } = await params;
  return <CaseWorkersPanel caseId={caseId} />;
}
