import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

const PHASES = [
  { status: "intake",      label: "Intake",      badge: "bg-blue-100 text-blue-700"      },
  { status: "treatment",   label: "Treatment",   badge: "bg-yellow-100 text-yellow-800"  },
  { status: "demand",      label: "Demand",      badge: "bg-orange-100 text-orange-700"  },
  { status: "negotiation", label: "Negotiation", badge: "bg-purple-100 text-purple-700"  },
  { status: "settlement",  label: "Settlement",  badge: "bg-green-100 text-green-700"    },
  { status: "litigation",  label: "Litigation",  badge: "bg-red-100 text-red-700"        },
  { status: "closed",      label: "Closed",      badge: "bg-gray-100 text-gray-600"      },
] as const;

const LEAD_STATUS_BADGE: Record<string, string> = {
  New:       "bg-blue-100 text-blue-700",
  Contacted: "bg-yellow-100 text-yellow-800",
  Qualified: "bg-green-100 text-green-700",
  Converted: "bg-purple-100 text-purple-700",
  Rejected:  "bg-red-100 text-red-700",
};

function phaseBadge(status: string) {
  return (
    PHASES.find((p) => p.status === status) ?? {
      label: status,
      badge: "bg-gray-100 text-gray-500",
    }
  );
}

function formatUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function daysOpen(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
}

function timeAgo(date: string) {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatPhone(phone: string | null) {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1"))
    return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10)
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

function formatCaseType(raw: string): string {
  const map: Record<string, string> = {
    motor_vehicle_accident: "Motor Vehicle Accident",
    slip_and_fall:          "Slip & Fall",
    slip___fall:            "Slip & Fall",
    premises_liability:     "Premises Liability",
    wrongful_death:         "Wrongful Death",
    product_liability:      "Product Liability",
    dog_bite:               "Dog Bite",
    trucking_accident:      "Trucking Accident",
    motorcycle_accident:    "Motorcycle Accident",
    pedestrian_accident:    "Pedestrian Accident",
    other:                  "Other",
  };
  return (
    map[raw?.toLowerCase()] ??
    raw?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ??
    "Unknown"
  );
}

export default async function DashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    allCasesRes,
    activeCountRes,
    newLeadsCountRes,
    recentCasesRes,
    recentLeadsRes,
    recentSmsRes,
    financialsRes,
    thisMonthCountRes,
  ] = await Promise.all([
    supabaseAdmin.from("cases").select("case_status, case_type"),
    supabaseAdmin
      .from("cases")
      .select("*", { count: "exact", head: true })
      .neq("case_status", "archived")
      .neq("case_status", "closed"),
    supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .in("status", ["New", "Contacted", "Qualified"]),
    supabaseAdmin
      .from("cases")
      .select("id, case_number, client_name, case_status, case_type, created_at, phone")
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("leads")
      .select("id, client_name, phone, status, accident_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("sms_messages")
      .select("id, from_number, body, sent_at, case_id")
      .eq("direction", "inbound")
      .order("sent_at", { ascending: false })
      .limit(5),
    supabaseAdmin.from("case_provider_financials").select("original_bill"),
    supabaseAdmin
      .from("cases")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth),
  ]);

  const activeCount    = activeCountRes.count    ?? 0;
  const newLeadsCount  = newLeadsCountRes.count  ?? 0;
  const thisMonthCount = thisMonthCountRes.count ?? 0;

  const totalBilled = (financialsRes.data ?? []).reduce(
    (sum, f) => sum + (f.original_bill ?? 0),
    0
  );

  const phaseCounts: Record<string, number> = {};
  for (const row of allCasesRes.data ?? []) {
    const s = row.case_status ?? "intake";
    phaseCounts[s] = (phaseCounts[s] ?? 0) + 1;
  }

  const negotiationCount = phaseCounts["negotiation"] ?? 0;
  const recentCases      = recentCasesRes.data ?? [];
  const recentLeads      = recentLeadsRes.data ?? [];
  const recentSms        = recentSmsRes.data  ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2b2b2b]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#6b6b6b]">Operations overview</p>
      </div>

      {/* ── Section 1: Top stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {(
          [
            { label: "Active Cases",        value: activeCount,       fmt: "number", href: "/cases"                     },
            { label: "New Leads",           value: newLeadsCount,     fmt: "number", href: "/leads"                     },
            { label: "Cases This Month",    value: thisMonthCount,    fmt: "number", href: "/cases"                     },
            { label: "Total Medical Billed",value: totalBilled,       fmt: "usd",    href: null                         },
            { label: "In Negotiation",      value: negotiationCount,  fmt: "number", href: "/cases"                     },
          ] as const
        ).map((stat) => {
          const display = stat.fmt === "usd" ? formatUSD(stat.value) : stat.value;
          const inner = (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9b9b9b]">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-[#2b2b2b]">{display}</p>
            </>
          );
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-[#e5e5e5] bg-white p-4 shadow-sm"
            >
              {stat.href ? (
                <Link href={stat.href} className="block">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </div>
          );
        })}
      </div>

      {/* ── Section 2: Pipeline breakdown ────────────────────────────────── */}
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#9b9b9b]">
          Pipeline
        </p>
        <div className="flex flex-wrap gap-3">
          {PHASES.map((phase) => (
            <Link
              key={phase.status}
              href="/cases"
              className="flex items-center gap-2 rounded-lg border border-[#e5e5e5] px-3 py-2 transition hover:border-[#d5d5d5] hover:bg-[#fafafa]"
            >
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${phase.badge}`}>
                {phase.label}
              </span>
              <span className="text-sm font-bold text-[#2b2b2b]">
                {phaseCounts[phase.status] ?? 0}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Section 3: Three-column feed ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Recent Cases */}
        <div className="rounded-xl border border-[#e5e5e5] bg-white shadow-sm">
          <div className="border-b border-[#e5e5e5] px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9b9b9b]">
              Recent Cases
            </p>
          </div>
          <div className="divide-y divide-[#f3f3f3]">
            {recentCases.length === 0 ? (
              <p className="px-5 py-4 text-sm italic text-[#b9b9b9]">No cases yet.</p>
            ) : (
              recentCases.map((c) => {
                const phase = phaseBadge(c.case_status ?? "intake");
                return (
                  <Link
                    key={c.id}
                    href={`/cases/${c.id}/overview`}
                    className="flex items-start justify-between gap-3 px-5 py-3 transition hover:bg-[#fafafa]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#2b2b2b]">
                        {c.client_name ?? "—"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {c.case_type && (
                          <span className="rounded-full bg-[#f3f3f3] px-2 py-0.5 text-xs text-[#6b6b6b]">
                            {formatCaseType(c.case_type)}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${phase.badge}`}
                        >
                          {phase.label}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-[#9b9b9b]">
                      {daysOpen(c.created_at)}d
                    </span>
                  </Link>
                );
              })
            )}
          </div>
          <div className="border-t border-[#f3f3f3] px-5 py-3">
            <Link href="/cases" className="text-xs font-medium text-[#1d4f91] hover:underline">
              View all cases →
            </Link>
          </div>
        </div>

        {/* Recent Leads */}
        <div className="rounded-xl border border-[#e5e5e5] bg-white shadow-sm">
          <div className="border-b border-[#e5e5e5] px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9b9b9b]">
              Recent Leads
            </p>
          </div>
          <div className="divide-y divide-[#f3f3f3]">
            {recentLeads.length === 0 ? (
              <p className="px-5 py-4 text-sm italic text-[#b9b9b9]">No leads yet.</p>
            ) : (
              recentLeads.map((lead) => {
                const badgeClass =
                  LEAD_STATUS_BADGE[lead.status] ?? "bg-gray-100 text-gray-500";
                const isAutoLead =
                  !lead.client_name?.trim() ||
                  lead.client_name.trim() === "AccidentIntel Auto-Lead";
                const displayName = isAutoLead
                  ? formatPhone(lead.phone)
                  : lead.client_name;
                return (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="flex items-start justify-between gap-3 px-5 py-3 transition hover:bg-[#fafafa]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#2b2b2b]">
                        {displayName}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {lead.accident_type && (
                          <span className="rounded-full bg-[#f3f3f3] px-2 py-0.5 text-xs text-[#6b6b6b]">
                            {formatCaseType(lead.accident_type)}
                          </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
                          {lead.status}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-[#9b9b9b]">
                      {new Date(lead.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
          <div className="border-t border-[#f3f3f3] px-5 py-3">
            <Link href="/leads" className="text-xs font-medium text-[#1d4f91] hover:underline">
              View all leads →
            </Link>
          </div>
        </div>

        {/* Recent Inbound SMS */}
        <div className="rounded-xl border border-[#e5e5e5] bg-white shadow-sm">
          <div className="border-b border-[#e5e5e5] px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9b9b9b]">
              Recent Inbound SMS
            </p>
          </div>
          <div className="divide-y divide-[#f3f3f3]">
            {recentSms.length === 0 ? (
              <p className="px-5 py-4 text-sm italic text-[#b9b9b9]">No messages yet.</p>
            ) : (
              recentSms.map((sms) => (
                <Link
                  key={sms.id}
                  href="/messages"
                  className="block px-5 py-3 transition hover:bg-[#fafafa]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#2b2b2b]">
                      {formatPhone(sms.from_number)}
                    </span>
                    <span className="shrink-0 text-xs text-[#9b9b9b]">{timeAgo(sms.sent_at)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[#6b6b6b]">
                    {sms.body
                      ? sms.body.slice(0, 60) + (sms.body.length > 60 ? "..." : "")
                      : "—"}
                  </p>
                </Link>
              ))
            )}
          </div>
          <div className="border-t border-[#f3f3f3] px-5 py-3">
            <Link href="/messages" className="text-xs font-medium text-[#1d4f91] hover:underline">
              View all messages →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
