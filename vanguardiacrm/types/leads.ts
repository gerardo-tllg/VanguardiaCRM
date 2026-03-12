export type LeadStatus = "New" | "Reviewed" | "Accepted" | "Rejected" | "Archived";

export type LeadRecord = {
  id: string;
  created_at: string;
  status: LeadStatus | string;
  client_name: string;
  phone: string | null;
  email: string | null;
  accident_date: string | null;
  accident_type: string | null;
  injuries: string | null;
  ai_summary: string | null;
  raw_payload: Record<string, unknown> | null;
  lang: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
};