import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

type DashboardCardProps = {
  title: string;
  value: number;
  href: string;
  description: string;
};

async function getCount(
  table: string,
  options?: {
    eq?: Array<{ column: string; value: string | number | boolean | null }>;
    neq?: Array<{ column: string; value: string | number | boolean | null }>;
    in?: Array<{ column: string; value: Array<string | number> }>;
  }
) {
  try {
    let query = supabaseAdmin.from(table).select("*", {
      count: "exact",
      head: true,
    });

    for (const filter of options?.eq ?? []) {
      query = query.eq(filter.column, filter.value);
    }

    for (const filter of options?.neq ?? []) {
      query = query.neq(filter.column, filter.value);
    }

    for (const filter of options?.in ?? []) {
      query = query.in(filter.column, filter.value);
    }

    const { count, error } = await query;

    if (error) {
      console.error(`Failed to count ${table}:`, error.message);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error(`Unexpected error counting ${table}:`, error);
    return 0;
  }
}

function DashboardCard({
  title,
  value,
  href,
  description,
}: DashboardCardProps) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-[#e5e5e5] bg-white p-6 transition hover:border-[#d7c1bc] hover:bg-[#fcfaf9]"
    >
      <div className="text-sm text-[#6b6b6b]">{title}</div>
      <div className="mt-2 text-3xl font-bold text-[#2b2b2b]">{value}</div>
      <div className="mt-3 text-sm text-[#8a8a8a]">{description}</div>
    </Link>
  );
}

export default async function DashboardPage() {
  const [
    activeCasesCount,
    newLeadsCount,
    unreadMessagesCount,
    pendingSignaturesCount,
  ] = await Promise.all([
    getCount("cases", {
  eq: [{ column: "status", value: "Open" }],
}),
    getCount("leads", {
      in: [{ column: "status", value: ["New", "Contacted", "Qualified"] }],
    }),
    getCount("messages", {
      eq: [{ column: "status", value: "Unread" }],
    }),
    getCount("e_signatures", {
      eq: [{ column: "status", value: "Pending" }],
    }),
  ]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-[#2b2b2b]">Dashboard</h1>
        <p className="mt-2 text-[#6b6b6b]">
          Overview of leads, cases, messages, and firm activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Active Cases"
          value={activeCasesCount}
          href="/projects"
          description="Open the Projects workspace"
        />

        <DashboardCard
          title="New Leads"
          value={newLeadsCount}
          href="/leads"
          description="Review incoming lead submissions"
        />

        <DashboardCard
          title="Unread Messages"
          value={unreadMessagesCount}
          href="/messages"
          description="Open the Messages workspace"
        />

        <DashboardCard
          title="Pending Signatures"
          value={pendingSignaturesCount}
          href="/collect/e-signatures"
          description="Review pending signature requests"
        />
      </div>
    </>
  );
}