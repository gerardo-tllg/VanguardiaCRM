export const dynamic = "force-dynamic";

import { supabaseAdmin } from "@/lib/supabase/admin";

type LeadRow = {
  id: string;
  source_channel: string | null;
  source_campaign: string | null;
};

type CaseRow = {
  id: string;
  lead_id: string | null;
  status: string | null;
  phase: string | null;
};

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function getRate(converted: number, total: number) {
  if (!total) return 0;
  return (converted / total) * 100;
}

function normalize(value: string | null | undefined, fallback: string) {
  return value && value.trim() ? value.trim() : fallback;
}

export default async function ReportsPage() {
  const [{ data: leads }, { data: cases }] = await Promise.all([
    supabaseAdmin
      .from("leads")
      .select("id, source_channel, source_campaign"),
    supabaseAdmin
      .from("cases")
      .select("id, lead_id, status, phase"),
  ]);

  const leadRows = (leads ?? []) as LeadRow[];
  const caseRows = (cases ?? []) as CaseRow[];

  const convertedLeadIds = new Set(
    caseRows
      .map((caseItem) => caseItem.lead_id)
      .filter((value): value is string => Boolean(value))
  );

  const totalLeads = leadRows.length;
  const convertedCases = convertedLeadIds.size;
  const conversionRate = getRate(convertedCases, totalLeads);

  const sourceMap = new Map<
    string,
    {
      source_channel: string;
      source_campaign: string;
      total_leads: number;
      converted_cases: number;
    }
  >();

  for (const lead of leadRows) {
    const sourceChannel = normalize(lead.source_channel, "unknown");
    const sourceCampaign = normalize(lead.source_campaign, "unknown");
    const key = `${sourceChannel}::${sourceCampaign}`;

    const current =
      sourceMap.get(key) ??
      {
        source_channel: sourceChannel,
        source_campaign: sourceCampaign,
        total_leads: 0,
        converted_cases: 0,
      };

    current.total_leads += 1;

    if (convertedLeadIds.has(lead.id)) {
      current.converted_cases += 1;
    }

    sourceMap.set(key, current);
  }

  const sourceRows = Array.from(sourceMap.values()).sort((a, b) => {
    if (b.converted_cases !== a.converted_cases) {
      return b.converted_cases - a.converted_cases;
    }

    return b.total_leads - a.total_leads;
  });

  const phaseMap = new Map<string, number>();

  for (const caseItem of caseRows) {
    const phase = normalize(caseItem.phase, "Unknown");
    phaseMap.set(phase, (phaseMap.get(phase) ?? 0) + 1);
  }

  const phaseRows = Array.from(phaseMap.entries())
    .map(([phase, count]) => ({ phase, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-[#2b2b2b]">Reports</h1>
        <p className="mt-2 text-[#6b6b6b]">
          Lead conversion, source performance, and case pipeline reporting.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
          <div className="text-sm text-[#6b6b6b]">Total Leads</div>
          <div className="mt-2 text-3xl font-bold text-[#2b2b2b]">
            {totalLeads}
          </div>
          <p className="mt-3 text-sm text-[#8a8a8a]">
            All leads currently stored in the CRM.
          </p>
        </div>

        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
          <div className="text-sm text-[#6b6b6b]">Converted Cases</div>
          <div className="mt-2 text-3xl font-bold text-[#2b2b2b]">
            {convertedCases}
          </div>
          <p className="mt-3 text-sm text-[#8a8a8a]">
            Leads that have been converted into cases.
          </p>
        </div>

        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
          <div className="text-sm text-[#6b6b6b]">Conversion Rate</div>
          <div className="mt-2 text-3xl font-bold text-[#2b2b2b]">
            {formatPercent(conversionRate)}
          </div>
          <p className="mt-3 text-sm text-[#8a8a8a]">
            Converted cases divided by total leads.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-[#e5e5e5] bg-white">
        <div className="border-b border-[#e5e5e5] p-6">
          <h2 className="text-2xl font-semibold text-[#2b2b2b]">
            Lead Conversion by Source
          </h2>
          <p className="mt-2 text-sm text-[#6b6b6b]">
            Tracks which source channels and campaigns are producing actual cases.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#e5e5e5] bg-[#fafafa] text-left text-[#2b2b2b]">
              <tr>
                <th className="px-5 py-4 font-semibold">Source Channel</th>
                <th className="px-5 py-4 font-semibold">Campaign</th>
                <th className="px-5 py-4 font-semibold">Total Leads</th>
                <th className="px-5 py-4 font-semibold">Converted Cases</th>
                <th className="px-5 py-4 font-semibold">Conversion Rate</th>
              </tr>
            </thead>

            <tbody>
              {sourceRows.length > 0 ? (
                sourceRows.map((row) => {
                  const rate = getRate(row.converted_cases, row.total_leads);

                  return (
                    <tr
                      key={`${row.source_channel}-${row.source_campaign}`}
                      className="border-b border-[#eeeeee] last:border-b-0"
                    >
                      <td className="px-5 py-4 font-medium text-[#2b2b2b]">
                        {row.source_channel}
                      </td>
                      <td className="px-5 py-4 text-[#555555]">
                        {row.source_campaign}
                      </td>
                      <td className="px-5 py-4 text-[#555555]">
                        {row.total_leads}
                      </td>
                      <td className="px-5 py-4 text-[#555555]">
                        {row.converted_cases}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-[#e4c9c4] bg-[#fdf6f5] px-3 py-1 text-xs font-medium text-[#4b0a06]">
                          {formatPercent(rate)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-[#6b6b6b]"
                  >
                    No lead source data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-[#e5e5e5] bg-white">
        <div className="border-b border-[#e5e5e5] p-6">
          <h2 className="text-2xl font-semibold text-[#2b2b2b]">
            Case Pipeline
          </h2>
          <p className="mt-2 text-sm text-[#6b6b6b]">
            Current cases grouped by phase.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          {phaseRows.length > 0 ? (
            phaseRows.map((row) => (
              <div
                key={row.phase}
                className="rounded-xl border border-[#eeeeee] bg-[#fafafa] p-5"
              >
                <div className="text-sm text-[#6b6b6b]">{row.phase}</div>
                <div className="mt-2 text-2xl font-bold text-[#2b2b2b]">
                  {row.count}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-[#eeeeee] bg-[#fafafa] p-5 text-sm text-[#6b6b6b]">
              No case pipeline data found.
            </div>
          )}
        </div>
      </div>
    </>
  );
}