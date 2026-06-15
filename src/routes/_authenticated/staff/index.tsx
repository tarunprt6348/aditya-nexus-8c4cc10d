import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];
const COLUMNS: TaskStatus[] = ["todo", "in_progress", "done"];

export const Route = createFileRoute("/_authenticated/staff/")({
  head: () => ({ meta: [{ title: "My Tasks — Staff" }] }),
  component: Tasks,
});

function Tasks() {
  const [rows, setRows] = useState<any[]>([]);
  const [uid, setUid] = useState<string>("");

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setUid(u.user.id);
    const { data } = await supabase.from("staff_tasks").select("*").eq("assigned_to", u.user.id).order("due_date", { ascending: true });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  async function advance(id: string, status: TaskStatus) {
    const { error } = await supabase.from("staff_tasks").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl">My Tasks</h1>
      <p className="mt-1 text-muted-foreground">{rows.length} assigned to you</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <div key={col}>
            <h2 className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">{col.replace("_", " ")}</h2>
            <div className="space-y-3">
              {rows.filter((r) => r.status === col).map((t) => (
                <Card key={t.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium">{t.title}</h3>
                    <Badge variant="outline" className="capitalize">{t.priority}</Badge>
                  </div>
                  {t.description && <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{t.description}</p>}
                  {t.due_date && <p className="mt-2 text-xs text-muted-foreground">Due {new Date(t.due_date).toLocaleDateString()}</p>}
                  <div className="mt-3 flex gap-2">
                    {col !== "in_progress" && col !== "done" && <Button size="sm" variant="outline" onClick={() => advance(t.id, "in_progress")}>Start</Button>}
                    {col !== "done" && <Button size="sm" onClick={() => advance(t.id, "done")}>Complete</Button>}
                    {col === "done" && <Button size="sm" variant="ghost" onClick={() => advance(t.id, "todo")}>Reopen</Button>}
                  </div>
                </Card>
              ))}
              {rows.filter((r) => r.status === col).length === 0 && (
                <p className="text-xs text-muted-foreground">Nothing here.</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {!uid && <p className="text-muted-foreground">Sign in to see your tasks.</p>}
    </div>
  );
}
