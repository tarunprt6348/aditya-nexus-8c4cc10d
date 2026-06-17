import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/site/PermissionGuard";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  head: () => ({ meta: [{ title: "Messages — Owner" }] }),
  component: () => <PermissionGuard module="messages"><Messages /></PermissionGuard>,
});

function Messages() {
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  async function markHandled(id: string, handled: boolean) {
    const { error } = await supabase.from("contact_messages").update({ handled }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Contact Messages</h1>
      <p className="mt-1 text-muted-foreground">{rows.length} total</p>
      <div className="mt-6 grid gap-3">
        {rows.map((m) => (
          <Card key={m.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium">{m.name} <span className="ml-2 text-xs text-muted-foreground">{m.email}{m.phone ? ` · ${m.phone}` : ""}</span></h3>
                {m.subject && <p className="mt-1 text-sm font-medium">{m.subject}</p>}
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{m.message}</p>
              </div>
              <Button size="sm" variant={m.handled ? "outline" : "default"} onClick={() => markHandled(m.id, !m.handled)}>
                {m.handled ? "Reopen" : "Mark handled"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-center text-muted-foreground">No messages yet.</p>}
      </div>
    </div>
  );
}
