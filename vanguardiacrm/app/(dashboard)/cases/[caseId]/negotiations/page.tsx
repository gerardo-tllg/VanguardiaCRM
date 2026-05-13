import NegotiationsTab from "@/components/case/NegotiationsTab";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CaseNegotiationsPage({ params }: PageProps) {
  const { caseId } = await params;
  return <NegotiationsTab caseId={caseId} />;
}
