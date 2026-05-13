import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/lib/auth/require-api-user";

type RouteContext = {
  params: Promise<{ caseProviderId: string }>;
};

const CASE_PROVIDER_FIELDS = new Set([
  "treatment_description",
  "treatment_status",
  "first_visit_date",
  "last_visit_date",
  "visit_count",
  "account_number",
  "records_status",
  "billing_status",
  "signed_lop",
  "lien_filed",
  "case_notes",
]);

const FINANCIALS_FIELDS = new Set([
  "original_bill",
  "adjusted_bill",
  "client_paid",
  "medpay_pip_paid",
  "insurance_paid",
  "still_owed",
  "paid_plus_owed",
  "records_requested_date",
  "records_received_date",
  "bills_requested_date",
  "bills_received_date",
  "lien_notes",
  "insurance_notes",
]);

const NUMERIC_FINANCIALS_FIELDS = new Set([
  "original_bill",
  "adjusted_bill",
  "client_paid",
  "medpay_pip_paid",
  "insurance_paid",
  "still_owed",
  "paid_plus_owed",
]);

function sanitizeNumeric(val: unknown): number | null {
  if (val === "" || val === null || val === undefined) return null;
  const cleaned = String(val).replace(/[$,]/g, "");
  const n = Number(cleaned);
  return isNaN(n) ? null : n;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { response } = await requireApiUser();
    if (response) return response;

    const { caseProviderId } = await context.params;

    const { data, error } = await supabaseAdmin
      .from("case_providers")
      .select(`
        id, treatment_description, treatment_status,
        first_visit_date, last_visit_date, visit_count, account_number,
        records_status, billing_status, signed_lop, lien_filed, case_notes,
        providers ( id, name, provider_type, specialty ),
        case_provider_financials (
          id, original_bill, adjusted_bill, client_paid, medpay_pip_paid,
          insurance_paid, still_owed, paid_plus_owed,
          records_requested_date, records_received_date,
          bills_requested_date, bills_received_date,
          lien_notes, insurance_notes
        )
      `)
      .eq("id", caseProviderId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Case provider not found" }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { response } = await requireApiUser();
    if (response) return response;

    const { caseProviderId } = await context.params;
    const body = await req.json();

    console.log("[case-provider PATCH] caseProviderId:", caseProviderId);
    console.log("[case-provider PATCH] raw body:", JSON.stringify(body));

    const providerUpdate: Record<string, unknown> = {};
    const financialsUpdate: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      if (CASE_PROVIDER_FIELDS.has(key)) {
        providerUpdate[key] = value;
      } else if (FINANCIALS_FIELDS.has(key)) {
        financialsUpdate[key] = NUMERIC_FINANCIALS_FIELDS.has(key)
          ? sanitizeNumeric(value)
          : value;
      }
    }

    console.log("[case-provider PATCH] providerUpdate fields:", JSON.stringify(providerUpdate));
    console.log("[case-provider PATCH] financialsUpdate fields (pre-upsert):", JSON.stringify(financialsUpdate));

    if (Object.keys(providerUpdate).length > 0) {
      const { error } = await supabaseAdmin
        .from("case_providers")
        .update(providerUpdate)
        .eq("id", caseProviderId);

      if (error) {
        console.error("[case-provider PATCH] case_providers update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      console.log("[case-provider PATCH] case_providers update OK");
    }

    if (Object.keys(financialsUpdate).length > 0) {
      const financialsData = { ...financialsUpdate, case_provider_id: caseProviderId };
      console.log("[case-provider PATCH] financialsData being upserted:", JSON.stringify(financialsData));

      const { data: upsertData, error: upsertError } = await supabaseAdmin
        .from("case_provider_financials")
        .upsert(financialsData, { onConflict: "case_provider_id" })
        .select();

      console.log("[case-provider PATCH] upsert response data:", JSON.stringify(upsertData));
      console.log("[case-provider PATCH] upsert response error:", JSON.stringify(upsertError));

      if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }
    } else {
      console.log("[case-provider PATCH] no financials fields in body — skipping upsert");
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[case-provider PATCH] unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
