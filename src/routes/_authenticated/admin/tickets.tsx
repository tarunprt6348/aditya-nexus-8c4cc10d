import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/tickets")({
  head: () => ({ meta: [{ title: "Tickets — Admin" }] }),
  component: Tickets,
});

function Tickets() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
      setRows(data ?? []);
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl">Support Tickets</h1>
      <p className="mt-1 text-muted-foreground">{rows.length} total</p>
      <div className="mt-6 grid gap-3">
        {rows.map((t) => (
          <Card key={t.id} className="flex items-start justify-between p-5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{t.subject}</h3>
                <Badge variant="outline" className="capitalize">{t.priority}</Badge>
                <Badge className="capitalize">{t.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{t.description}</p>
            </div>
            <span className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-center text-muted-foreground">No tickets yet.</p>}
      </div>
    </div>
  );
}
