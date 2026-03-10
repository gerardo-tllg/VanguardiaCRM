"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
};

type CollectSubnavProps = {
  items: NavItem[];
};

export default function CollectSubnav({ items }: CollectSubnavProps) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-8 border-b border-[#e5e5e5]">
      {items.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`border-b-2 pb-3 text-lg font-semibold transition ${
              isActive
                ? "border-[#4b0a06] text-[#4b0a06]"
                : "border-transparent text-[#6b6b6b] hover:text-[#2b2b2b]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}