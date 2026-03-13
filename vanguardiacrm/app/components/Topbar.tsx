"use client";

import { signOut } from "next-auth/react";

export default function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[#e5e5e5] bg-white px-6">
      <div className="text-sm text-[#6b6b6b]">Vanguardia CRM</div>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
      >
        Sign Out
      </button>
    </header>
  );
}
