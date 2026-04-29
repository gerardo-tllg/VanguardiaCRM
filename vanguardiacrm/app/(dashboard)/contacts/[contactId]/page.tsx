export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ contactId: string }>;
};

function formatName(contact: {
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  full_name: string | null;
}) {
  if (contact.full_name) return contact.full_name;

  return [contact.first_name, contact.middle_name, contact.last_name]
    .filter(Boolean)
    .join(" ") || "Unknown Contact";
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { contactId } = await params;

  const { data: contact, error } = await supabaseAdmin
    .from("contacts")
    .select(
      `
      id,
      first_name,
      middle_name,
      last_name,
      full_name,
      email,
      phone,
      contact_type,
      contact_cases (
        id,
        relationship,
        cases (
          id,
          case_number,
          client_name,
          case_type,
          status,
          phase,
          created_at
        )
      )
    `
    )
    .eq("id", contactId)
    .single();

  if (error || !contact) {
    notFound();
  }

  const linkedCases = (contact.contact_cases ?? [])
    .map((link) => {
      const caseRecord = Array.isArray(link.cases)
        ? link.cases[0]
        : link.cases;

      return caseRecord
        ? {
            linkId: link.id,
            relationship: link.relationship,
            case: caseRecord,
          }
        : null;
    })
    .filter(Boolean);

  const uniqueCases = Array.from(
    new Map(
      linkedCases.map((item) => [item!.case.id, item])
    ).values()
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
        <Link
          href="/contacts"
          className="text-sm font-medium text-[#4b0a06] hover:underline"
        >
          ← Back to Contacts
        </Link>

        <h1 className="mt-4 text-4xl font-bold text-[#2b2b2b]">
          {formatName(contact)}
        </h1>

        <p className="mt-2 text-sm text-[#6b6b6b]">
          {contact.contact_type || "client"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#2b2b2b]">
            Contact Details
          </h2>

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <span className="font-medium">Phone:</span>{" "}
              {contact.phone || "N/A"}
            </div>
            <div>
              <span className="font-medium">Email:</span>{" "}
              {contact.email || "N/A"}
            </div>
            <div>
              <span className="font-medium">Type:</span>{" "}
              {contact.contact_type || "client"}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 xl:col-span-2">
          <h2 className="text-lg font-semibold text-[#2b2b2b]">
            Linked Cases
          </h2>

          <div className="mt-4 space-y-3">
            {uniqueCases.length > 0 ? (
              uniqueCases.map((item) => (
                <Link
                  key={item!.case.id}
                  href={`/cases/${item!.case.case_number}/overview`}
                  className="block rounded-lg border border-[#eeeeee] bg-[#fafafa] p-4 hover:bg-[#fcfaf9]"
                >
                  <div className="font-medium text-[#4b0a06] underline">
                    {item!.case.client_name || "Case"} -{" "}
                    {item!.case.case_number}
                  </div>

                  <div className="mt-2 text-sm text-[#555555]">
                    Status: {item!.case.status || "—"} · Phase:{" "}
                    {item!.case.phase || "—"} · Relationship:{" "}
                    {item!.relationship || "client"}
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-[#6b6b6b]">
                No linked cases found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}