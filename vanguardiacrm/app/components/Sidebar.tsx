"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const items = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/projects" },
  { label: "Leads", href: "/leads" },
  { label: "AI Receptionist", href: "/ai-receptionist" },
  { label: "Contacts", href: "/contacts" },
  { label: "Messages", href: "/messages" },
  { label: "Collect", href: "/collect" },
  { label: "Medical Treatment", href: "/medical-treatment" },
  { label: "Reports", href: "/reports" },
  { label: "Automations", href: "/automations" },
  { label: "Calendar", href: "/calendar" },
  { label: "Company Settings", href: "/company-settings" },
  { label: "My Account", href: "/my-account" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [unreadSms, setUnreadSms] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      const { count } = await supabase
        .from("sms_messages")
        .select("id", { count: "exact", head: true })
        .eq("direction", "inbound")
        .eq("read", false);
      setUnreadSms(count ?? 0);
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, [supabase]);

  return (
    <aside className="w-62.5 min-h-screen bg-white border-r border-[#e5e5e5] flex flex-col">
      <div className="h-14 border-b border-[#e5e5e5] flex items-center px-5 font-semibold text-[#2b2b2b]">
        Vanguardia CRM
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const isMessages = item.href === "/messages";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center justify-between rounded-md px-4 py-3 text-sm transition-all duration-200",
                active
                  ? "bg-[#f3e7e5] text-[#4b0a06] font-semibold border border-[#e4c9c4] shadow-sm"
                  : "text-[#6b6b6b] hover:bg-[#f8eeee] hover:text-[#4b0a06] hover:shadow-[0_0_0_1px_rgba(75,10,6,0.15),0_4px_10px_rgba(75,10,6,0.08)]",
              ].join(" ")}
            >
              <span>{item.label}</span>
              {isMessages && unreadSms > 0 && (
                <span className="ml-2 flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                  {unreadSms > 99 ? "99+" : unreadSms}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
