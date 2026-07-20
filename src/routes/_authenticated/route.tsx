import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getStoredToken } from "@/integrations/auth/client";
import { RoleProvider } from "@/contexts/RoleContext";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const token = getStoredToken();
    if (!token) throw redirect({ to: "/auth" });
    // Token presence is enough here — RoleContext will verify server-side
    return {};
  },
  component: () => (
    <RoleProvider>
      <Outlet />
    </RoleProvider>
  ),
});
