"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import GlobalCaseSearch from "./GlobalCaseSearch";
import NotificationBell from "./NotificationBell";

export default function Topbar() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-14 border-b border-[#e5e5e5] bg-white flex items-center justify-between px-6 gap-6">
      <div className="flex-1 max-w-xl">
        <GlobalCaseSearch />
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <button
          onClick={handleSignOut}
          className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}