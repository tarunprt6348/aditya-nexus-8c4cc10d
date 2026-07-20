/**
 * PermissionGuard — wraps a section in a role permission check.
 * Shows a "no access" message if the current role cannot access the module.
 */
import { useRole } from "@/contexts/RoleContext";
import type { Module } from "@/lib/permissions";
import { ShieldOff } from "lucide-react";

interface Props {
  module: Module;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ module, children, fallback }: Props) {
  const { can } = useRole();

  if (!can(module)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldOff className="h-12 w-12 text-muted-foreground/40" />
        <div>
          <h2 className="font-display text-xl">Access restricted</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your role does not have access to this module.
            Contact an owner or admin to request access.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
