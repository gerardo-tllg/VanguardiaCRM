import Link from "next/link";

export type ContactCaseLink = {
  id: string;
  relationship: string | null;
  case: {
    id: string;
    case_number: string | null;
    client_name: string | null;
    case_type: string | null;
    status: string | null;
    phase: string | null;
    created_at: string | null;
  } | null;
};

export type ContactRow = {
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
  contact_cases: ContactCaseLink[];
};

type ContactsTableProps = {
  contacts?: ContactRow[];
};

function getTypeStyles(type: string | null | undefined) {
  switch (type) {
    case "client":
    case "Client":
      return "bg-[#f3e7e5] text-[#4b0a06] border border-[#e4c9c4]";
    case "provider":
    case "Provider":
      return "bg-[#ecf8f1] text-[#1f7a4d] border border-[#b9e4cf]";
    case "adjuster":
    case "Adjuster":
      return "bg-[#eef4ff] text-[#1d4f91] border border-[#c9daf7]";
    case "witness":
    case "Witness":
      return "bg-[#fff7e8] text-[#8a5a00] border border-[#f1d9a6]";
    case "employer":
    case "Employer":
      return "bg-[#f3f3f3] text-[#555555] border border-[#dddddd]";
    case "referral":
    case "Referral":
      return "bg-[#f8f0ff] text-[#6b2ea6] border border-[#dec8f7]";
    default:
      return "bg-[#f8f8f8] text-[#444444] border border-[#e5e5e5]";
  }
}

function getStatusStyles(status: string | null | undefined) {
  switch (status) {
    case "Active":
    case "active":
      return "bg-[#ecf8f1] text-[#1f7a4d] border border-[#b9e4cf]";
    case "Inactive":
    case "inactive":
      return "bg-[#f3f3f3] text-[#6b6b6b] border border-[#dddddd]";
    default:
      return "bg-[#ecf8f1] text-[#1f7a4d] border border-[#b9e4cf]";
  }
}

function formatLabel(value: string | null | undefined, fallback = "—") {
  if (!value || !value.trim()) return fallback;

  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getDisplayName(contact: ContactRow) {
  if (contact.full_name?.trim()) return formatLabel(contact.full_name, "Unknown");

  const parts = [
    contact.first_name,
    contact.middle_name,
    contact.last_name,
  ].filter((part): part is string => Boolean(part?.trim()));

  return parts.length > 0 ? parts.map((part) => formatLabel(part, "")).join(" ") : "Unknown";
}

function getFirstName(contact: ContactRow) {
  if (contact.first_name?.trim()) return formatLabel(contact.first_name, "—");

  const name = getDisplayName(contact);
  return name.split(" ")[0] || "—";
}

function getLastName(contact: ContactRow) {
  if (contact.last_name?.trim()) return formatLabel(contact.last_name, "—");

  const nameParts = getDisplayName(contact).split(" ").filter(Boolean);
  return nameParts.length > 1 ? nameParts.slice(1).join(" ") : "—";
}

export default function ContactsTable({ contacts = [] }: ContactsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e5e5] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[#e5e5e5] bg-[#f8f8f8]">
            <tr className="text-left text-[#2b2b2b]">
              <th className="px-5 py-4 font-semibold">First Name</th>
              <th className="px-5 py-4 font-semibold">Last Name</th>
              <th className="px-5 py-4 font-semibold">Type</th>
              <th className="px-5 py-4 font-semibold">Projects</th>
              <th className="px-5 py-4 font-semibold">Phone</th>
              <th className="px-5 py-4 font-semibold">Email</th>
              <th className="px-5 py-4 font-semibold">Company</th>
              <th className="px-5 py-4 font-semibold">City</th>
              <th className="px-5 py-4 font-semibold">Status</th>
            </tr>
          </thead>

          <tbody>
            {contacts.length > 0 ? (
              contacts.map((contact) => {
                const linkedCases = contact.contact_cases ?? [];
                const firstCase = linkedCases[0]?.case ?? null;
                const remainingCount = Math.max(linkedCases.length - 1, 0);

                return (
                  <tr
                    key={contact.id}
                    className="border-b border-[#eeeeee] last:border-b-0 hover:bg-[#fcfaf9]"
                  >
                    <td className="px-5 py-4 font-medium">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="text-[#2b2b2b] underline underline-offset-2 hover:text-[#4b0a06]"
                      >
                        {getFirstName(contact)}
                      </Link>
                    </td>

                    <td className="px-5 py-4 font-medium">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="text-[#2b2b2b] underline underline-offset-2 hover:text-[#4b0a06]"
                      >
                        {getLastName(contact)}
                      </Link>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getTypeStyles(
                          contact.contact_type
                        )}`}
                      >
                        {formatLabel(contact.contact_type, "Client")}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {firstCase?.case_number ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/cases/${firstCase.case_number}/overview`}
                            className="inline-flex rounded-full bg-[#f1f1f1] px-4 py-2 text-sm font-medium text-[#4b0a06] underline underline-offset-2 hover:text-[#5f0d08]"
                          >
                            {firstCase.client_name || getDisplayName(contact)} - {firstCase.case_number}
                          </Link>

                          {remainingCount > 0 ? (
                            <Link
                              href={`/contacts/${contact.id}`}
                              className="inline-flex rounded-full border border-[#e5e5e5] bg-white px-3 py-1 text-xs text-[#555555] hover:bg-[#f7f7f7] hover:text-[#4b0a06]"
                            >
                              +{remainingCount} more
                            </Link>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-[#8a8a8a]">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-[#444444]">
                      {contact.phone || "N/A"}
                    </td>

                    <td className="px-5 py-4 text-[#444444]">
                      {contact.email || "N/A"}
                    </td>

                    <td className="px-5 py-4 text-[#444444]">
                      {contact.company || "—"}
                    </td>

                    <td className="px-5 py-4 text-[#444444]">
                      {contact.city || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusStyles(
                          contact.status
                        )}`}
                      >
                        {formatLabel(contact.status, "Active")}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={9}
                  className="px-5 py-8 text-center text-sm text-[#6b6b6b]"
                >
                  No contacts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
