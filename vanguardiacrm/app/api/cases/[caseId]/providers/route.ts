import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ caseId: string }>;
};

function toNullableString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const body = await req.json();
    const supabase = await createClient();

    console.log("ADD PROVIDER REQUEST:", { caseId, body });

    const { data: caseRecord, error: caseError } = await supabase
      .from("cases")
      .select("id, case_number")
      .eq("case_number", caseId)
      .single();

    if (caseError || !caseRecord) {
      console.error("CASE LOOKUP ERROR:", caseError);
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    let providerId: string | null =
      typeof body.provider_id === "string" && body.provider_id.trim()
        ? body.provider_id.trim()
        : null;

    if (!providerId) {
      const providerPayload = {
        name: toNullableString(body.name),
        provider_type: toNullableString(body.provider_type),
        specialty: toNullableString(body.specialty),
        phone: toNullableString(body.phone),
        fax: toNullableString(body.fax),
        email: toNullableString(body.email),
        website: toNullableString(body.website),
        address_line_1: toNullableString(body.address_line_1),
        address_line_2: toNullableString(body.address_line_2),
        city: toNullableString(body.city),
        state: toNullableString(body.state),
        zip: toNullableString(body.zip),
        billing_contact_name: toNullableString(body.billing_contact_name),
        billing_contact_email: toNullableString(body.billing_contact_email),
        billing_contact_phone: toNullableString(body.billing_contact_phone),
        notes: toNullableString(body.notes),
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
        console.error("PROVIDER CREATE ERROR:", providerError);
        return NextResponse.json(
          { error: providerError?.message || "Failed to create provider" },
          { status: 500 }
        );
      }

      providerId = newProvider.id;
    }

    const { data: existingLink, error: existingLinkError } = await supabase
      .from("case_providers")
      .select("id")
      .eq("case_id", caseRecord.id)
      .eq("provider_id", providerId)
      .maybeSingle();

    if (existingLinkError) {
      console.error("EXISTING LINK CHECK ERROR:", existingLinkError);
      return NextResponse.json(
        { error: existingLinkError.message || "Failed to check case provider" },
        { status: 500 }
      );
    }

    if (existingLink?.id) {
      return NextResponse.json(
        { success: true, caseProviderId: existingLink.id, duplicate: true },
        { status: 200 }
      );
    }

    const { data: caseProvider, error: caseProviderError } = await supabase
      .from("case_providers")
      .insert({
        case_id: caseRecord.id,
        provider_id: providerId,
        treatment_description: toNullableString(body.treatment_description),
        treatment_status: toNullableString(body.treatment_status) ?? "Active",
        records_status: toNullableString(body.records_status) ?? "Not Requested",
        billing_status: toNullableString(body.billing_status) ?? "Not Requested",
      })
      .select("id")
      .single();

    if (caseProviderError || !caseProvider) {
      console.error("CASE PROVIDER CREATE ERROR:", caseProviderError);
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
      console.error("FINANCIAL CREATE ERROR:", financialError);
      return NextResponse.json(
        {
          error:
            financialError.message || "Failed to create provider financial record",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, caseProviderId: caseProvider.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("ADD PROVIDER UNCAUGHT ERROR:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}