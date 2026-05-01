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
    supabaseAdmin.from("cases").select("id, lead_id, status, phase"),
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
        .map((r) => r.source_campaign)
        .filter((v): v is string => Boolean(v?.trim()))
    )
  );

  const sourceOptions = Array.from(
    new Set(
      ((sourceData ?? []) as Array<{ source_channel: string | null }>)
        .map((r) => r.source_channel)
        .filter((v): v is string => Boolean(v?.trim()))
    )
  );

  const filteredLeadIds = new Set(leadRows.map((l) => l.id));
  const convertedLeadIds = new Set<string>();

  for (const c of caseRows) {
    if (typeof c.lead_id === "string" && filteredLeadIds.has(c.lead_id)) {
      convertedLeadIds.add(c.lead_id);
    }
  }

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
    const sc = normalize(lead.source_channel, "unknown");
    const camp = normalize(lead.source_campaign, "unknown");
    const key = `${sc}::${camp}`;

    const current =
      sourceMap.get(key) ?? {
        source_channel: sc,
        source_campaign: camp,
        total_leads: 0,
        converted_cases: 0,
      };

    current.total_leads++;

    if (convertedLeadIds.has(lead.id)) {
      current.converted_cases++;
    }

    sourceMap.set(key, current);
  }

  const sourceRows = Array.from(sourceMap.values());

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
          <input type="date" name="start" defaultValue={start ?? ""} />
          <input type="date" name="end" defaultValue={end ?? ""} />

          <select name="channel" defaultValue={channel ?? ""}>
            <option value="">All Sources</option>
            {sourceOptions.map((s) => (
              <option key={s} value={s}>
                {formatSourceChannel(s)}
              </option>
            ))}
          </select>

          <select name="campaign" defaultValue={campaign ?? ""}>
            <option value="">All Campaigns</option>
            {campaignOptions.map((c) => (
              <option key={c} value={c}>
                {formatCampaign(c)}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-md bg-[#4b0a06] px-4 py-2 text-white"
          >
            Apply
          </button>
        </div>
      </form>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 border bg-white rounded-xl">
          <div>Total Leads</div>
          <div className="text-2xl font-bold">{totalLeads}</div>
        </div>

        <div className="p-4 border bg-white rounded-xl">
          <div>Converted Cases</div>
          <div className="text-2xl font-bold">{convertedCases}</div>
        </div>

        <div className="p-4 border bg-white rounded-xl">
          <div>Conversion Rate</div>
          <div className="text-2xl font-bold">
            {formatPercent(conversionRate)}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">
          Lead Conversion by Source
        </h2>

        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Source</th>
              <th>Campaign</th>
              <th>Leads</th>
              <th>Converted</th>
              <th>Rate</th>
            </tr>
          </thead>

          <tbody>
            {sourceRows.map((row) => (
              <tr key={row.source_channel + row.source_campaign}>
                <td>{formatSourceChannel(row.source_channel)}</td>
                <td>{formatCampaign(row.source_campaign)}</td>
                <td>{row.total_leads}</td>
                <td>{row.converted_cases}</td>
                <td>
                  {formatPercent(
                    getRate(row.converted_cases, row.total_leads)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}