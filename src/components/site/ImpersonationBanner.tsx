import { useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function ImpersonationBanner() {
  const { isImpersonating, impersonationName, stopImpersonation } = useRole();
  const navigate = useNavigate();

  if (!isImpersonating) return null;

  async function handleExit() {
    await stopImpersonation();
    navigate({ to: "/admin" });
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-4 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md">
      <span className="flex items-center gap-2">
        <Eye className="h-4 w-4 shrink-0" />
        Viewing as <strong>{impersonationName}</strong> — Impersonation mode is active. All actions are logged.
      </span>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 shrink-0 border border-white/30 text-white hover:bg-white/20 hover:text-white"
        onClick={handleExit}
      >
        <X className="mr-1 h-3 w-3" />
        Exit
      </Button>
    </div>
  );
}
