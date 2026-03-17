"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { label: "Overview", slug: "overview" },
  { label: "Client", slug: "client" },
  { label: "Incident", slug: "incident" },
  { label: "Medical Treatment", slug: "medical-treatment" },
  { label: "Documents", slug: "documents" },
  { label: "Settlement", slug: "settlement" },
];

export default function CaseTabs({ caseNumber }: { caseNumber: string }) {
  const pathname = usePathname();

  return (
    <div className="border-b border-[#e5e5e5] bg-white px-6">
      <nav className="flex flex-wrap gap-2 py-3">
        {sections.map((section) => {
          const href = `/cases/${caseNumber}/${section.slug}`;
          const active = pathname === href;

          return (
            <Link
              key={section.slug}
              href={href}
              className={[
                "rounded-md border px-4 py-2 text-sm font-medium transition",
                active
                  ? "border-[#e4c9c4] bg-[#f3e7e5] text-[#4b0a06]"
                  : "border-transparent text-[#6b6b6b] hover:bg-[#f8eeee] hover:text-[#4b0a06]",
              ].join(" ")}
            >
              {section.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}