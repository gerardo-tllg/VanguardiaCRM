export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type CaseRecord = {
  id: string;
  case_number: string;
  client_name: string;
  case_type: string | null;
  phone: string | null;
  email: string | null;
  phase: string | null;
  created_at: string;
};

function getPhaseStyles(phase: string | null) {
  switch (phase) {
    case "Settlement":
      return "border border-[#b9e4cf] bg-[#ecf8f1] text-[#1f7a4d]";
    case "Treatment Phase":
      return "border border-[#e6d8b8] bg-[#faf3df] text-[#8a6a17]";
    case "Welcome":
    default:
      return "border border-[#e4c9c4] bg-[#fdf6f5] text-[#4b0a06]";
  }
}

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: cases, error } = await supabase
    .from("cases")
.select("*")
.neq("status", "screening")
.order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to load cases:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  const rows = (cases ?? []) as CaseRecord[];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#2b2b2b]">Projects</h1>
          <p className="mt-1 text-sm text-[#6b6b6b]">
            Personal injury matters and portal activity
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

      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/projects/new-case"
          className="rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08]"
        >
          New Case
        </Link>

        <Link
          href="/projects/new-lead"
          className="rounded-md border border-[#e5e5e5] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
        >
          New Lead
        </Link>

        <div className="ml-4 rounded-full border border-[#e4c9c4] bg-[#fdf6f5] px-4 py-2 text-sm text-[#4b0a06]">
          Status is not Complete
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e5e5e5] bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[#e5e5e5] bg-[#fafafa] text-left text-[#2b2b2b]">
            <tr>
              <th className="px-5 py-4 font-semibold">Contact</th>
              <th className="px-5 py-4 font-semibold">Case Name</th>
              <th className="px-5 py-4 font-semibold">Case Type</th>
              <th className="px-5 py-4 font-semibold">Phase</th>
              <th className="px-5 py-4 font-semibold">Phone</th>
              <th className="px-5 py-4 font-semibold">Email</th>
              <th className="px-5 py-4 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((item) => (
                <tr key={item.id} className="border-b border-[#eeeeee]">
                  <td className="px-5 py-4 text-[#2b2b2b]">{item.client_name}</td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/cases/${item.case_number}/overview`}
                      className="text-[#4b0a06] underline"
                    >{/* where to change whats displayed next to case name */}
                      {item.client_name} - {item.case_type}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-[#555555]">
                    {item.case_type || "Personal Injury"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getPhaseStyles(
                        item.phase
                      )}`}
                    >
                      {item.phase || "Welcome"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#555555]">{item.phone || "N/A"}</td>
                  <td className="px-5 py-4 text-[#555555]">{item.email || "N/A"}</td>
                  <td className="px-5 py-4 text-[#555555]">
                    {new Date(item.created_at).toLocaleDateString("en-US")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-[#6b6b6b]">
                  No cases yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}