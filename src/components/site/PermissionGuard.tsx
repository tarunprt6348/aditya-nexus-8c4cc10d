import type { ReactNode } from "react";
import { useRole } from "@/contexts/RoleContext";
import type { Module } from "@/lib/permissions";
import { ShieldX } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

interface PermissionGuardProps {
  module: Module;
  children: ReactNode;
}

export function PermissionGuard({ module, children }: PermissionGuardProps) {
  const { can, loading, role } = useRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!can(module)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-red-50">
          <ShieldX className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="font-display text-2xl text-foreground">Access Denied</h2>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Your role (<span className="font-medium">{role}</span>) does not have permission
          to access this module. Contact the owner to request access.
        </p>
        <Button variant="outline" className="mt-6" asChild>
          <Link to="/admin">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
