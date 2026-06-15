import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/site/AdminSidebar";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: ok } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!ok) throw redirect({ to: "/portal" });
  },
  component: () => (
    <div className="flex min-h-dvh bg-muted/30">
      <AdminSidebar kind="admin" />
      <main className="flex-1 px-6 py-8 lg:px-10"><Outlet /></main>
      <Toaster richColors position="top-center" />
    </div>
  ),
});
