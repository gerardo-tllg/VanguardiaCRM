import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CaseMedicalProvidersTab from "../../../../components/CaseMedicalProvidersTab";

type PageProps = {
  params: Promise<{ caseId: string }>;
};

type ProviderDirectoryItem = {
  id: string;
  name: string;
  provider_type: string | null;
  specialty: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  website: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  billing_contact_name: string | null;
  billing_contact_email: string | null;
  billing_contact_phone: string | null;
  notes: string | null;
};

type FinancialItem = {
  id: string;
  original_bill: number | null;
  adjusted_bill: number | null;
  client_paid: number | null;
  medpay_pip_paid: number | null;
  insurance_paid: number | null;
  still_owed: number | null;
  paid_plus_owed: number | null;
  records_requested_date: string | null;
  records_received_date: string | null;
  bills_requested_date: string | null;
  bills_received_date: string | null;
  lien_notes: string | null;
  insurance_notes: string | null;
};

type CaseProviderItem = {
  id: string;
  case_id: string;
  provider_id: string;
  treatment_description: string | null;
  treatment_status: string | null;
  first_visit_date: string | null;
  last_visit_date: string | null;
  visit_count: number | null;
  account_number: string | null;
  records_status: string | null;
  billing_status: string | null;
  signed_lop: boolean;
  lien_filed: boolean;
  case_notes: string | null;
  providers: ProviderDirectoryItem | ProviderDirectoryItem[] | null;
  case_provider_financials: FinancialItem[] | null;
};

export default async function CaseMedicalTreatmentPage({
  params,
}: PageProps) {
  const { caseId } = await params;
  const supabase = await createClient();

  const { data: caseRecord, error: caseError } = await supabase
    .from("cases")
    .select("id, case_number, client_name")
    .eq("case_number", caseId)
    .single();

  if (caseError || !caseRecord) {
    notFound();
  }

  const { data: caseProviders, error: providersError } = await supabase
    .from("case_providers")
    .select(`
      id,
      case_id,
      provider_id,
      treatment_description,
      treatment_status,
      first_visit_date,
      last_visit_date,
      visit_count,
      account_number,
      records_status,
      billing_status,
      signed_lop,
      lien_filed,
      case_notes,
      providers (
        id,
        name,
        provider_type,
        specialty,
        phone,
        fax,
        email,
        website,
        address_line_1,
        address_line_2,
        city,
        state,
        zip,
        billing_contact_name,
        billing_contact_email,
        billing_contact_phone,
        notes
      ),
      case_provider_financials (
        id,
        original_bill,
        adjusted_bill,
        client_paid,
        medpay_pip_paid,
        insurance_paid,
        still_owed,
        paid_plus_owed,
        records_requested_date,
        records_received_date,
        bills_requested_date,
        bills_received_date,
        lien_notes,
        insurance_notes
      )
    `)
    .eq("case_id", caseRecord.id)
    .order("created_at", { ascending: true });

  if (providersError) {
    console.error("Failed to load case providers:", {
      message: providersError.message,
      details: providersError.details,
      hint: providersError.hint,
      code: providersError.code,
      caseNumber: caseRecord.case_number,
      caseId: caseRecord.id,
    });
  }

  const { data: providerDirectory, error: directoryError } = await supabase
    .from("providers")
    .select("*")
    .order("name", { ascending: true });

  if (directoryError) {
    console.error("Failed to load provider directory:", {
      message: directoryError.message,
      details: directoryError.details,
      hint: directoryError.hint,
      code: directoryError.code,
    });
  }

  return (
    <CaseMedicalProvidersTab
      caseNumber={caseRecord.case_number}
      initialCaseProviders={(caseProviders ?? []) as CaseProviderItem[]}
      providerDirectory={(providerDirectory ?? []) as ProviderDirectoryItem[]}
    />
  );
}