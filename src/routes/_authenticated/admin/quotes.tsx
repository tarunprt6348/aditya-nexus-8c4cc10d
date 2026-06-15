import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/quotes")({
  head: () => ({ meta: [{ title: "Quote Requests — Admin" }] }),
  component: Quotes,
});

function Quotes() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("quote_requests").select("*").order("created_at", { ascending: false });
      setRows(data ?? []);
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl">Quote Requests</h1>
      <p className="mt-1 text-muted-foreground">{rows.length} total</p>
      <div className="mt-6 grid gap-4">
        {rows.map((q) => (
          <Card key={q.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg">{q.name}</h3>
                  <Badge variant="outline" className="capitalize">{q.service_type?.replace("_", " ")}</Badge>
                  <Badge>{q.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{q.email} · {q.phone} · {q.location || "—"}</p>
                <p className="mt-3 text-sm">{q.requirements}</p>
                {q.ai_estimate && (
                  <p className="mt-2 text-xs text-gold">AI estimate: {q.ai_estimate}</p>
                )}
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {new Date(q.created_at).toLocaleString()}<br/>
                Budget: {q.budget_range || "—"}<br/>
                Timeline: {q.timeline || "—"}
              </div>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-center text-muted-foreground">No quote requests yet.</p>}
      </div>
    </div>
  );
}
