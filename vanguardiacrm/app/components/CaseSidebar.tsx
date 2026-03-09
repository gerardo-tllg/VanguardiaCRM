"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { label: "Overview", slug: "overview" },
  { label: "Client", slug: "client" },
  { label: "Incident", slug: "incident" },
  { label: "Medical Treatment", slug: "medical-treatment" },
  { label: "Documents", slug: "documents" },
  { label: "Notes", slug: "notes" },
  { label: "Settlement", slug: "settlement" },
];

export default function CaseSidebar({ caseId }: { caseId: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-65 min-h-screen bg-white border-r border-[#e5e5e5]">
      <div className="h-14 border-b border-[#e5e5e5] flex items-center px-5 font-semibold text-[#2b2b2b]">
        Case Workspace
      </div>

      <nav className="p-3 space-y-1">
        {sections.map((section) => {
          const href = `/cases/${caseId}/${section.slug}`;
          const active = pathname === href;

          return (
            <Link
              key={section.slug}
              href={href}
              className={[
                "block rounded-md px-4 py-3 text-sm transition-all duration-200",
                active
                  ? "bg-[#f3e7e5] text-[#4b0a06] font-semibold border border-[#e4c9c4]"
                  : "text-[#6b6b6b] hover:bg-[#f8eeee] hover:text-[#4b0a06]",
              ].join(" ")}
            >
              {section.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}