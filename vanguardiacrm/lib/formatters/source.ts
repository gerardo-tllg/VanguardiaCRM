export function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatSourceChannel(value: string | null | undefined) {
  if (!value) return "Unknown";

  const map: Record<string, string> = {
    manual: "Manual Entry",
    accidentintel: "Accident Intel",
    whatsapp: "WhatsApp",
  };

  return map[value.toLowerCase()] ?? formatLabel(value);
}

export function formatCampaign(value: string | null | undefined) {
  if (!value) return "—";

  const lower = value.toLowerCase();

  const map: Record<string, string> = {
    "manual-entry": "Manual Entry",
    "accidentintel-live": "Accident Intel (Live)",
    "whatsapp-intake": "WhatsApp Intake",
  };

  if (map[lower]) return map[lower];

  return formatLabel(value);
}