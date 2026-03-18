import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CasePage({ params }: PageProps) {
  const { caseId } = await params;
  redirect(`/cases/${caseId}/overview`);
}