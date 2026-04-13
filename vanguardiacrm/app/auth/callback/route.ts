import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams, origin } = url;

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    console.error("OAuth callback returned error:", {
      error,
      errorCode,
      errorDescription,
    });

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}&error_code=${encodeURIComponent(
        errorCode ?? ""
      )}&error_description=${encodeURIComponent(errorDescription ?? "")}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("Failed to exchange code for session:", {
      message: exchangeError.message,
      status: exchangeError.status,
      code: exchangeError.code,
    });

    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}