import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ChatAssistant } from "@/components/site/ChatAssistant";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_marketing")({
  component: MarketingLayout,
});

function MarketingLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
      />
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <ChatAssistant />
      <Toaster richColors position="top-center" />
    </div>
  );
}
