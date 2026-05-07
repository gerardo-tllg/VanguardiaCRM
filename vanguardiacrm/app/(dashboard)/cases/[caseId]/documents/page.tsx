import CaseDocumentsTab from "@/app/components/CaseDocumentsTab";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseDocumentsPage({ params }: PageProps) {
  const { caseId } = await params;
  return <CaseDocumentsTab caseId={caseId} />;
}
