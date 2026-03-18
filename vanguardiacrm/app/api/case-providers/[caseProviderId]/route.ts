import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ caseProviderId: string }>;
};

function toNullableNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toNullableString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { caseProviderId } = await context.params;
    const body = await req.json();

    const supabase = await createClient();

    // ✅ 1. Ensure case provider exists
    const { data: existingCaseProvider, error: existingError } =
      await supabase
        .from("case_providers")
        .select("id")
        .eq("id", caseProviderId)
        .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    if (!existingCaseProvider) {
      return NextResponse.json(
        { error: "Case provider not found" },
        { status: 404 }
      );
    }

    // ✅ 2. Update case_providers
    const caseProviderPayload = {
      treatment_description: toNullableString(body.treatment_description),
      treatment_status: toNullableString(body.treatment_status),
      first_visit_date: body.first_visit_date || null,
      last_visit_date: body.last_visit_date || null,
      visit_count: toNullableNumber(body.visit_count),
      account_number: toNullableString(body.account_number),
      records_status: toNullableString(body.records_status),
      billing_status: toNullableString(body.billing_status),
      signed_lop: Boolean(body.signed_lop),
      lien_filed: Boolean(body.lien_filed),
      case_notes: toNullableString(body.case_notes),
      updated_at: new Date().toISOString(),
    };

    const { data: updatedRows, error: updateError } = await supabase
      .from("case_providers")
      .update(caseProviderPayload)
      .eq("id", caseProviderId)
      .select("id");

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        {
          error:
            "No rows updated (likely RLS issue or invalid ID)",
        },
        { status: 403 }
      );
    }

    // ✅ 3. Prepare financial payload
    const financialPayload = {
      original_bill: toNullableNumber(body.original_bill),
      adjusted_bill: toNullableNumber(body.adjusted_bill),
      client_paid: toNullableNumber(body.client_paid),
      medpay_pip_paid: toNullableNumber(body.medpay_pip_paid),
      insurance_paid: toNullableNumber(body.insurance_paid),
      still_owed: toNullableNumber(body.still_owed),
      paid_plus_owed: toNullableNumber(body.paid_plus_owed),
      records_requested_date: body.records_requested_date || null,
      records_received_date: body.records_received_date || null,
      bills_requested_date: body.bills_requested_date || null,
      bills_received_date: body.bills_received_date || null,
      lien_notes: toNullableString(body.lien_notes),
      insurance_notes: toNullableString(body.insurance_notes),
      updated_at: new Date().toISOString(),
    };

    // ✅ 4. Check if financial record exists
    const { data: existingFinancial, error: financialCheckError } =
      await supabase
        .from("case_provider_financials")
        .select("id")
        .eq("case_provider_id", caseProviderId)
        .maybeSingle();

    if (financialCheckError) {
      return NextResponse.json(
        { error: financialCheckError.message },
        { status: 500 }
      );
    }

    // ✅ 5. Update OR Insert financials
    if (existingFinancial?.id) {
      const { data: updatedFinancial, error: financialError } =
        await supabase
          .from("case_provider_financials")
          .update(financialPayload)
          .eq("case_provider_id", caseProviderId)
          .select("id");

      if (financialError) {
        return NextResponse.json(
          { error: financialError.message },
          { status: 500 }
        );
      }

      if (!updatedFinancial || updatedFinancial.length === 0) {
        return NextResponse.json(
          {
            error:
              "Financial update failed (possible RLS issue)",
          },
          { status: 403 }
        );
      }
    } else {
      const { data: insertedFinancial, error: insertError } =
        await supabase
          .from("case_provider_financials")
          .insert({
            case_provider_id: caseProviderId,
            ...financialPayload,
          })
          .select("id");

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }

      if (!insertedFinancial || insertedFinancial.length === 0) {
        return NextResponse.json(
          { error: "Financial insert failed" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Server error",
      },
      { status: 500 }
    );
  }
}