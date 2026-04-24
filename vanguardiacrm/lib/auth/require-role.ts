import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireRole(allowedRoles: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!data || !allowedRoles.includes(data.role)) {
    redirect("/dashboard");
  }

  return data.role;
}