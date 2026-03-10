import Link from "next/link";

type Contact = {
  id: string;
  name: string;
  type: "Client" | "Provider" | "Adjuster" | "Witness" | "Employer" | "Referral";
  phone: string;
  email: string;
  relatedCase?: string;
  company?: string;
  city?: string;
  status: "Active" | "Inactive";
};

const contacts: Contact[] = [
  {
    id: "contact_001",
    name: "Reyna Vazquez",
    type: "Client",
    phone: "(956) 325-3075",
    email: "reynavazquez06@icloud.com",
    relatedCase: "case0001",
    company: "",
    city: "San Juan, TX",
    status: "Active",
  },
  {
    id: "contact_002",
    name: "Urgent Care South Texas",
    type: "Provider",
    phone: "(956) 405-3780",
    email: "records@urgentcaresouthtx.com",
    relatedCase: "case0001",
    company: "Urgent Care South Texas",
    city: "McAllen, TX",
    status: "Active",
  },
  {
    id: "contact_003",
    name: "Nathan Heinze",
    type: "Adjuster",
    phone: "(210) 531-8722",
    email: "nheinze@carrier.com",
    relatedCase: "case0002",
    company: "Carrier Insurance",
    city: "San Antonio, TX",
    status: "Active",
  },
  {
    id: "contact_004",
    name: "Carlos Cortez",
    type: "Client",
    phone: "(956) 684-7014",
    email: "",
    relatedCase: "case0002",
    company: "",
    city: "Mercedes, TX",
    status: "Active",
  },
  {
    id: "contact_005",
    name: "Maria Lopez",
    type: "Witness",
    phone: "(956) 555-1882",
    email: "mlopez@email.com",
    relatedCase: "",
    company: "",
    city: "Weslaco, TX",
    status: "Inactive",
  },
];

function getTypeStyles(type: Contact["type"]) {
  switch (type) {
    case "Client":
      return "bg-[#f3e7e5] text-[#4b0a06] border border-[#e4c9c4]";
    case "Provider":
      return "bg-[#ecf8f1] text-[#1f7a4d] border border-[#b9e4cf]";
    case "Adjuster":
      return "bg-[#eef4ff] text-[#1d4f91] border border-[#c9daf7]";
    case "Witness":
      return "bg-[#fff7e8] text-[#8a5a00] border border-[#f1d9a6]";
    case "Employer":
      return "bg-[#f3f3f3] text-[#555555] border border-[#dddddd]";
    case "Referral":
      return "bg-[#f8f0ff] text-[#6b2ea6] border border-[#dec8f7]";
    default:
      return "bg-[#f8f8f8] text-[#444444] border border-[#e5e5e5]";
  }
}

function getStatusStyles(status: Contact["status"]) {
  switch (status) {
    case "Active":
      return "bg-[#ecf8f1] text-[#1f7a4d] border border-[#b9e4cf]";
    case "Inactive":
      return "bg-[#f3f3f3] text-[#6b6b6b] border border-[#dddddd]";
    default:
      return "bg-[#f8f8f8] text-[#444444] border border-[#e5e5e5]";
  }
}

export default function ContactsTable() {
  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f8f8f8] border-b border-[#e5e5e5]">
            <tr className="text-left text-[#2b2b2b]">
              <th className="px-5 py-4 font-semibold">Name</th>
              <th className="px-5 py-4 font-semibold">Type</th>
              <th className="px-5 py-4 font-semibold">Phone</th>
              <th className="px-5 py-4 font-semibold">Email</th>
              <th className="px-5 py-4 font-semibold">Company</th>
              <th className="px-5 py-4 font-semibold">City</th>
              <th className="px-5 py-4 font-semibold">Related Case</th>
              <th className="px-5 py-4 font-semibold">Status</th>
            </tr>
          </thead>

          <tbody>
            {contacts.map((contact) => (
              <tr
                key={contact.id}
                className="border-b border-[#eeeeee] last:border-b-0 hover:bg-[#fcfaf9]"
              >
                <td className="px-5 py-4 font-medium text-[#2b2b2b]">
                  {contact.name}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getTypeStyles(
                      contact.type
                    )}`}
                  >
                    {contact.type}
                  </span>
                </td>

                <td className="px-5 py-4 text-[#444444]">{contact.phone}</td>

                <td className="px-5 py-4 text-[#444444]">
                  {contact.email || "N/A"}
                </td>

                <td className="px-5 py-4 text-[#444444]">
                  {contact.company || "—"}
                </td>

                <td className="px-5 py-4 text-[#444444]">{contact.city || "—"}</td>

                <td className="px-5 py-4">
                  {contact.relatedCase ? (
                    <Link
                      href={`/cases/${contact.relatedCase}/overview`}
                      className="font-medium text-[#4b0a06] underline underline-offset-2 hover:text-[#5f0d08]"
                    >
                      {contact.relatedCase}
                    </Link>
                  ) : (
                    <span className="text-[#8a8a8a]">—</span>
                  )}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusStyles(
                      contact.status
                    )}`}
                  >
                    {contact.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}