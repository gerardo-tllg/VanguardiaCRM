"use client";

import { signIn } from "next-auth/react";

export default function GoogleSignInButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      className="w-full rounded-md bg-[#4b0a06] px-4 py-3 text-sm font-medium text-white hover:bg-[#5f0d08]"
    >
      Sign in with Google
    </button>
  );
}