export const dynamic = "force-dynamic";

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  formatSourceChannel,
  formatCampaign,
} from "@/lib/formatters/source";

type LeadRow = {
  id: string;
  source_channel: string | null;
  source_campaign: string | null;
  created_at: string;
};

type CaseRow = {
  id: string;
  lead_id: string | null;
  source_channel: string | null;
  source_campaign: string | null;
  status: string | null;
  phase: string | null;
};

type ReportsSearchParams = {
  start?: string | string[];
  end?: string | string[];
  channel?: string | string[];
  campaign?: string | string[];
};

function getParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || undefined;
}

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

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<ReportsSearchParams>;
}) {
  const params = (await searchParams) ?? {};

  const start = getParam(params.start);
  const end = getParam(params.end);
  const channel = getParam(params.channel);
  const campaign = getParam(params.campaign);

  let leadsQuery = supabaseAdmin
    .from("leads")
    .select("id, source_channel, source_campaign, created_at");

  if (start) leadsQuery = leadsQuery.gte("created_at", start);
  if (end) leadsQuery = leadsQuery.lte("created_at", end);
  if (channel) leadsQuery = leadsQuery.eq("source_channel", channel);
  if (campaign) leadsQuery = leadsQuery.eq("source_campaign", campaign);

  const [
    { data: leads },
    { data: cases },
    { data: campaignData },
    { data: sourceData },
  ] = await Promise.all([
    leadsQuery,
    supabaseAdmin.from("cases").select("id, lead_id, source_channel, source_campaign, status, phase"),
    supabaseAdmin
      .from("leads")
      .select("source_campaign")
      .not("source_campaign", "is", null),
    supabaseAdmin
      .from("leads")
      .select("source_channel")
      .not("source_channel", "is", null),
  ]);

  const leadRows = (leads ?? []) as LeadRow[];
  const caseRows = (cases ?? []) as CaseRow[];

  const campaignOptions = Array.from(
    new Set(
      ((campaignData ?? []) as Array<{ source_campaign: string | null }>)
        .map((row) => row.source_campaign)
        .filter((value): value is string => Boolean(value?.trim()))
    )
  );

  const sourceOptions = Array.from(
    new Set(
      ((sourceData ?? []) as Array<{ source_channel: string | null }>)
        .map((row) => row.source_channel)
        .filter((value): value is string => Boolean(value?.trim()))
    )
  );

  const filteredCaseRows = caseRows.filter((caseItem) => {
  const caseChannel = normalize(caseItem.source_channel, "unknown");
  const caseCampaign = normalize(caseItem.source_campaign, "unknown");

  if (channel && caseChannel !== channel) return false;
  if (campaign && caseCampaign !== campaign) return false;

  return true;
});

const totalLeads = leadRows.length;
const convertedCases = filteredCaseRows.length;
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
      sourceMap.get(key) ?? {
        source_channel: sourceChannel,
        source_campaign: sourceCampaign,
        total_leads: 0,
        converted_cases: 0,
      };

    current.total_leads += 1;

    current.converted_cases = filteredCaseRows.filter((caseItem) => {
  const caseChannel = normalize(caseItem.source_channel, "unknown");
  const caseCampaign = normalize(caseItem.source_campaign, "unknown");

  return caseChannel === sourceChannel && caseCampaign === sourceCampaign;
}).length;

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

      <form
        method="GET"
        action="/reports"
        className="mb-6 rounded-xl border border-[#e5e5e5] bg-white p-5"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#6b6b6b]">
              Start Date
            </label>
            <input
              type="date"
              name="start"
              defaultValue={start ?? ""}
              className="rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-sm text-[#2b2b2b] outline-none focus:border-[#4b0a06]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#6b6b6b]">
              End Date
            </label>
            <input
              type="date"
              name="end"
              defaultValue={end ?? ""}
              className="rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-sm text-[#2b2b2b] outline-none focus:border-[#4b0a06]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#6b6b6b]">
              Source
            </label>
            <select
              name="channel"
              defaultValue={channel ?? ""}
              className="min-w-45 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-sm text-[#2b2b2b] outline-none focus:border-[#4b0a06]"
            >
              <option value="">All Sources</option>
              {sourceOptions.map((sourceOption) => (
                <option key={sourceOption} value={sourceOption}>
                  {formatSourceChannel(sourceOption)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#6b6b6b]">
              Campaign
            </label>
            <select
              name="campaign"
              defaultValue={campaign ?? ""}
              className="min-w-60 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-sm text-[#2b2b2b] outline-none focus:border-[#4b0a06]"
            >
              <option value="">All Campaigns</option>
              {campaignOptions.map((campaignOption) => (
                <option key={campaignOption} value={campaignOption}>
                  {formatCampaign(campaignOption)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded-md bg-[#4b0a06] px-4 py-2 text-sm font-medium text-white hover:bg-[#5f0d08]"
          >
            Apply Filters
          </button>

          <a
            href="/reports"
            className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
          >
            Reset
          </a>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
          <div className="text-sm text-[#6b6b6b]">Total Leads</div>
          <div className="mt-2 text-3xl font-bold text-[#2b2b2b]">
            {totalLeads}
          </div>
          <p className="mt-3 text-sm text-[#8a8a8a]">
            Leads matching the selected filters.
          </p>
        </div>

        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
          <div className="text-sm text-[#6b6b6b]">Converted Cases</div>
          <div className="mt-2 text-3xl font-bold text-[#2b2b2b]">
            {convertedCases}
          </div>
          <p className="mt-3 text-sm text-[#8a8a8a]">
            Filtered leads that became cases.
          </p>
        </div>

        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6">
          <div className="text-sm text-[#6b6b6b]">Conversion Rate</div>
          <div className="mt-2 text-3xl font-bold text-[#2b2b2b]">
            {formatPercent(conversionRate)}
          </div>
          <p className="mt-3 text-sm text-[#8a8a8a]">
            Converted cases divided by filtered leads.
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
                        {formatSourceChannel(row.source_channel)}
                      </td>

                      <td className="px-5 py-4 text-[#555555]">
                        {formatCampaign(row.source_campaign)}
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