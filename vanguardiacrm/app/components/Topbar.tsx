"use client";

import { signOut } from "next-auth/react";
import GlobalCaseSearch from "../components/GlobalCaseSearch";

export default function Topbar() {
  return (
    <header className="h-14 border-b border-[#e5e5e5] bg-white flex items-center justify-between px-6 gap-6">
      
      {/* LEFT SIDE — replace static title with search */}
      <div className="flex-1 max-w-xl">
        <GlobalCaseSearch />
      </div>

      {/* RIGHT SIDE */}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
      >
        Sign Out
      </button>
    </header>
  );
}