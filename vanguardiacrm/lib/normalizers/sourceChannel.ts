export type SourceChannel = "manual" | "accidentintel" | "whatsapp";

export function normalizeSourceChannel(value: unknown): SourceChannel {
  if (typeof value !== "string") return "manual";

  const normalized = value.toLowerCase().trim();

  const map: Record<string, SourceChannel> = {
    manual: "manual",
    "manual-entry": "manual",
    internal: "manual",

    accidentintel: "accidentintel",
    "accident-intel": "accidentintel",
    accident_intel: "accidentintel",

    whatsapp: "whatsapp",
    "whats app": "whatsapp",
    whats_app: "whatsapp",
  };

  return map[normalized] ?? "manual";
}