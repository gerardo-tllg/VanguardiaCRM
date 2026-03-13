"use client";
import { signOut } from "next-auth/react";

export default function Topbar() {
  return (
    <header className="h-14 border-b border-[#e5e5e5] bg-white flex items-center justify-between px-6">
      <div className="text-sm text-[#6b6b6b]">
        Vanguardia CRM
      </div>

      <button className="bg-[#4b0a06] text-white px-4 py-2 rounded-full text-sm hover:bg-[#5a0c07]">
        Start Case Check
      </button>
      <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#2b2b2b] hover:bg-[#f7f7f7]"
    >
      Sign Out
    </button>
    </header>
    
  );
}