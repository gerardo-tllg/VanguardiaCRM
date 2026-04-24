import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { requireApiUser } from "@/lib/auth/require-api-user";

type RouteContext = {
  params: Promise<{ providerId: string }>;
};

function toNullableString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { response } = await requireApiUser();
        
            if (response) {
              return response;
            }
    const { providerId } = await context.params;
    const body = await req.json();
    const supabase = await createClient();

    const { data: existingProvider, error: existingError } = await supabase
      .from("providers")
      .select("id")
      .eq("id", providerId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message || "Failed to load provider" },
        { status: 500 }
      );
    }

    if (!existingProvider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    const updatePayload = {
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
      updated_at: new Date().toISOString(),
    };

    if (!updatePayload.name) {
      return NextResponse.json(
        { error: "Provider name is required" },
        { status: 400 }
      );
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("providers")
      .update(updatePayload)
      .eq("id", providerId)
      .select("id");

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to update provider" },
        { status: 500 }
      );
    }

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        {
          error:
            "No provider row was updated. This is usually caused by RLS update policy restrictions.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}