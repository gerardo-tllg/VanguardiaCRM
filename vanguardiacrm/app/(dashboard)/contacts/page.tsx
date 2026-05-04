export const dynamic = "force-dynamic";

import ContactsTable, { type ContactRow } from "../../components/ContactsTable";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RawContactCase = {
  id: string;
  relationship: string | null;
  cases:
    | {
        id: string;
        case_number: string | null;
        client_name: string | null;
        case_type: string | null;
        status: string | null;
        phase: string | null;
        created_at: string | null;
      }
    | {
        id: string;
        case_number: string | null;
        client_name: string | null;
        case_type: string | null;
        status: string | null;
        phase: string | null;
        created_at: string | null;
      }[]
    | null;
};

type RawContact = {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  contact_type: string | null;
  company: string | null;
  city: string | null;
  status: string | null;
  contact_cases: RawContactCase[] | null;
};

function normalizeContactRows(rows: RawContact[]): ContactRow[] {
  return rows.map((contact) => {
    const linkedCases = (contact.contact_cases ?? [])
      .map((link) => {
        const caseRecord = Array.isArray(link.cases)
          ? link.cases[0] ?? null
          : link.cases;

        return caseRecord;
      })
      .filter(Boolean);

    const hasOpenCase = linkedCases.some(
      (c) => c?.status && c.status !== "Closed"
    );

    const computedStatus = hasOpenCase ? "Active" : "Closed";

    return {
      id: contact.id,
      first_name: contact.first_name,
      middle_name: contact.middle_name,
      last_name: contact.last_name,
      full_name: contact.full_name,
      email: contact.email,
      phone: contact.phone,
      contact_type: contact.contact_type,
      company: contact.company,
      city: contact.city,

      // 👇 THIS is the fix
      status: computedStatus,

      contact_cases: (contact.contact_cases ?? []).map((link) => {
        const caseRecord = Array.isArray(link.cases)
          ? link.cases[0] ?? null
          : link.cases;

        return {
          id: link.id,
          relationship: link.relationship,
          case: caseRecord
            ? {
                id: caseRecord.id,
                case_number: caseRecord.case_number,
                client_name: caseRecord.client_name,
                case_type: caseRecord.case_type,
                status: caseRecord.status,
                phase: caseRecord.phase ?? "Welcome",
                created_at: caseRecord.created_at,
              }
            : null,
        };
      }),
    };
  });
}

export default async function ContactsPage() {
  const { data, error } = await supabaseAdmin
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
    status,
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
  .order("last_name", { ascending: true, nullsFirst: false })
  .order("first_name", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Failed to load contacts:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  const contacts = normalizeContactRows((data ?? []) as unknown as RawContact[]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#2b2b2b]">Contacts</h1>
          <p className="mt-2 text-[#6b6b6b]">
            Firm contacts, linked projects, and contact details.
          </p>
        </div>

        <div className="w-70">
          <input
            type="text"
            placeholder="Search"
            className="w-full rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm text-[#2b2b2b] placeholder:text-[#8a8a8a] outline-none focus:border-[#4b0a06]"
          />
        </div>
      </div>

      <ContactsTable contacts={contacts} />
    </>
  );
}
