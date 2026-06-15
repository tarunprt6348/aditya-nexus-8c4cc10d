import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, Building2, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Aditya Constructions" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [k, setK] = useState({ leads: 0, quotes: 0, projects: 0, tickets: 0 });
  useEffect(() => {
    (async () => {
      const [l, q, p, t] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("quote_requests").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("tickets").select("id", { count: "exact", head: true }),
      ]);
      setK({ leads: l.count ?? 0, quotes: q.count ?? 0, projects: p.count ?? 0, tickets: t.count ?? 0 });
    })();
  }, []);

  const cards = [
    { label: "Leads", v: k.leads, Icon: Users },
    { label: "Quote Requests", v: k.quotes, Icon: FileText },
    { label: "Projects", v: k.projects, Icon: Building2 },
    { label: "Tickets", v: k.tickets, Icon: MessageSquare },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Real-time operational overview.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, v, Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent><div className="font-display text-3xl">{v}</div></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
