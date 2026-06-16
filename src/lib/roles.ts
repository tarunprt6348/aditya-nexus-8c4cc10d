import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "staff" | "customer";

export async function fetchPrimaryRole(userId: string): Promise<Role> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as Role);
  if (roles.includes("admin")) return "admin";
  if (roles.includes("staff")) return "staff";
  return "customer";
}

export function homeForRole(role: Role): "/admin" | "/staff" | "/portal" {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/portal";
}
