// lib/formatters/caseType.ts

export function formatCaseType(type: string | null | undefined): string {
  if (!type) return "Unknown";

  const normalized = type.toLowerCase().trim();

  const map: Record<string, string> = {
    auto_accident: "Motor Vehicle Accident",
    mva: "Motor Vehicle Accident",
    motor_vehicle_accident: "Motor Vehicle Accident",

    truck_accident: "Truck Accident",

    slip__fall: "Slip & Fall",
    slip_fall: "Slip & Fall",
    "slip / fall": "Slip & Fall",
    slip: "Slip & Fall",

    premises_liability: "Premises Liability",

    unknown: "Unknown",
  };

  return map[normalized] ?? toTitleCase(normalized.replace(/_/g, " "));
}

function toTitleCase(str: string) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}