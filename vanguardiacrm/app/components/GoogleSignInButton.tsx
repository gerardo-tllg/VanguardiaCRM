"use client";

import { createClient } from "@/lib/supabase/clients";

export default function GoogleSignInButton() {
  async function handleSignIn() {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      console.error("Google sign-in failed:", error);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      className="rounded-lg bg-black px-4 py-2 text-white"
    >
      Continue with Google
    </button>
  );
}