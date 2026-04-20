"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type CaseSearchResult = {
  case_number: string;
  client_name: string | null;
  case_type: string | null;
  phone: string | null;
  email: string | null;
  accident_date: string | null;
};

export default function GlobalCaseSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CaseSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);

      try {
        const res = await fetch(
          `/api/cases/search?q=${encodeURIComponent(trimmed)}`
        );
        const data = await res.json();
        setResults(Array.isArray(data.cases) ? data.cases : []);
        setOpen(true);
      } catch (error) {
        console.error("Case search failed:", error);
        setResults([]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  function handleSelect(caseNumber: string) {
    setQuery("");
    setResults([]);
    setOpen(false);
    router.push(`/cases/${caseNumber}/overview`);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        placeholder="Search other cases by client, case #, phone, email, or type"
        className="w-full rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm text-[#2b2b2b] placeholder:text-[#8a8a8a] outline-none focus:border-[#4b0a06]"
      />

      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8a8a8a]">
          Searching...
        </div>
      )}

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-md border border-[#e5e5e5] bg-white shadow-lg">
          {results.length > 0 ? (
            results.map((item) => (
              <button
                key={item.case_number}
                type="button"
                onClick={() => handleSelect(item.case_number)}
                className="block w-full border-b border-[#eeeeee] px-4 py-3 text-left hover:bg-[#fcfaf9] last:border-b-0"
              >
                <div className="text-sm font-semibold text-[#2b2b2b]">
                  {item.client_name || "Unnamed Case"}
                </div>
                <div className="mt-1 text-xs text-[#6b6b6b]">
                  {item.case_number}
                  {item.case_type ? ` · ${item.case_type}` : ""}
                  {item.accident_date ? ` · DOI ${item.accident_date}` : ""}
                </div>
                <div className="mt-1 text-xs text-[#8a8a8a]">
                  {item.phone || "N/A"}
                  {item.email ? ` · ${item.email}` : ""}
                </div>
              </button>
            ))
          ) : query.trim() ? (
            <div className="px-4 py-3 text-sm text-[#6b6b6b]">
              No matching cases found.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}