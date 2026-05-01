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
  searchParams?: {
    start?: string;
    end?: string;
    channel?: string;
    campaign?: string;
  };
}) {
  const start = searchParams?.start?.trim() || undefined;
  const end = searchParams?.end?.trim() || undefined;
  const channel = searchParams?.channel?.trim() || undefined;
  const campaign = searchParams?.campaign?.trim() || undefined;

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

  // ✅ Campaign options
  const campaignOptions = Array.from(
    new Set(
      ((campaignData ?? []) as Array<{ source_campaign: string | null }>)
        .map((row) => row.source_campaign)
        .filter((v): v is string => Boolean(v?.trim()))
    )
  );

  // ✅ Source channel options
  const sourceOptions = Array.from(
    new Set(
      ((sourceData ?? []) as Array<{ source_channel: string | null }>)
        .map((row) => row.source_channel)
        .filter((v): v is string => Boolean(v?.trim()))
    )
  );

  const filteredLeadIds = new Set(leadRows.map((lead) => lead.id));

  const convertedLeadIds = new Set<string>();

  for (const caseItem of caseRows) {
    if (
      typeof caseItem.lead_id === "string" &&
      filteredLeadIds.has(caseItem.lead_id)
    ) {
      convertedLeadIds.add(caseItem.lead_id);
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

  const sourceRows = Array.from(sourceMap.values());

  const phaseMap = new Map<string, number>();

  for (const caseItem of caseRows) {
    const phase = normalize(caseItem.phase, "Unknown");
    phaseMap.set(phase, (phaseMap.get(phase) ?? 0) + 1);
  }

  const phaseRows = Array.from(phaseMap.entries()).map(([phase, count]) => ({
    phase,
    count,
  }));

  return (
    <>
      <h1 className="text-4xl font-bold mb-4">Reports</h1>

      <form method="GET" className="flex gap-3 mb-6">
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

        <button type="submit">Apply</button>
      </form>

      <div>Total Leads: {totalLeads}</div>
      <div>Converted Cases: {convertedCases}</div>
      <div>Conversion Rate: {formatPercent(conversionRate)}</div>
    </>
  );
}