import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ caseId: string }>;
};

export async function POST(req: Request, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const body = await req.json();
    const supabase = await createClient();

    const { data: caseRecord, error: caseError } = await supabase
      .from("cases")
      .select("id, case_number")
      .eq("case_number", caseId)
      .single();

    if (caseError || !caseRecord) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    let providerId: string | null = body.provider_id ?? null;

    if (!providerId) {
      const providerPayload = {
        name: body.name?.trim() || null,
        provider_type: body.provider_type?.trim() || null,
        specialty: body.specialty?.trim() || null,
        phone: body.phone?.trim() || null,
        fax: body.fax?.trim() || null,
        email: body.email?.trim() || null,
        website: body.website?.trim() || null,
        address_line_1: body.address_line_1?.trim() || null,
        address_line_2: body.address_line_2?.trim() || null,
        city: body.city?.trim() || null,
        state: body.state?.trim() || null,
        zip: body.zip?.trim() || null,
        billing_contact_name: body.billing_contact_name?.trim() || null,
        billing_contact_email: body.billing_contact_email?.trim() || null,
        billing_contact_phone: body.billing_contact_phone?.trim() || null,
        notes: body.notes?.trim() || null,
      };

      if (!providerPayload.name) {
        return NextResponse.json(
          { error: "Provider name is required" },
          { status: 400 }
        );
      }

      const { data: newProvider, error: providerError } = await supabase
        .from("providers")
        .insert(providerPayload)
        .select("id")
        .single();

      if (providerError || !newProvider) {
        return NextResponse.json(
          { error: providerError?.message || "Failed to create provider" },
          { status: 500 }
        );
      }

      providerId = newProvider.id;
    }

    const { data: existingLink } = await supabase
      .from("case_providers")
      .select("id")
      .eq("case_id", caseRecord.id)
      .eq("provider_id", providerId)
      .maybeSingle();

    if (existingLink) {
      return NextResponse.json(
        { success: true, caseProviderId: existingLink.id },
        { status: 200 }
      );
    }

    const { data: caseProvider, error: caseProviderError } = await supabase
      .from("case_providers")
      .insert({
        case_id: caseRecord.id,
        provider_id: providerId,
        treatment_status: body.treatment_status?.trim() || "Active",
        records_status: body.records_status?.trim() || "Not Requested",
        billing_status: body.billing_status?.trim() || "Not Requested",
        treatment_description: body.treatment_description?.trim() || null,
      })
      .select("id")
      .single();

    if (caseProviderError || !caseProvider) {
      return NextResponse.json(
        {
          error:
            caseProviderError?.message || "Failed to attach provider to case",
        },
        { status: 500 }
      );
    }

    const { error: financialError } = await supabase
      .from("case_provider_financials")
      .insert({
        case_provider_id: caseProvider.id,
      });

    if (financialError) {
      return NextResponse.json(
        { error: financialError.message || "Failed to create financial record" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, caseProviderId: caseProvider.id },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}