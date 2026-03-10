"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
};

type CollectSubnavProps = {
  items: NavItem[];
};

export default function CollectSubnav({ items }: CollectSubnavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current =
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  return (
    <div className="flex items-center gap-8 border-b border-[#e5e5e5]">
      {items.map((item) => {
        const active = current === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "border-b-2 pb-3 text-lg font-semibold transition",
              active
                ? "border-[#4b0a06] text-[#4b0a06]"
                : "border-transparent text-[#6b6b6b] hover:text-[#2b2b2b]",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}