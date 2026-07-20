/**
 * AdminLayout — wraps admin area routes with sidebar, mobile nav, and toasts.
 */
import { useState } from "react";
import { AdminSidebar } from "@/components/site/AdminSidebar";
import { ImpersonationBanner } from "@/components/site/ImpersonationBanner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export function AdminLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <ImpersonationBanner />

      {/* Mobile top bar */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSidebarOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="font-display text-sm">Aditya · Operations</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 md:static md:translate-x-0 md:block ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <AdminSidebar area="admin" onNavigate={() => setSidebarOpen(false)} />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden px-4 py-6 md:px-6 md:py-7 lg:px-10">
          {children}
        </main>
      </div>

      <Toaster richColors position="top-center" />
    </div>
  );
}
