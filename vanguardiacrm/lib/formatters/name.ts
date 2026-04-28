export function formatPersonName(name: string | null | undefined): string {
  if (!name) return "Unknown";

  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((part) =>
      part
        .split("-")
        .map((piece) =>
          piece ? piece.charAt(0).toUpperCase() + piece.slice(1) : piece
        )
        .join("-")
    )
    .join(" ");
}