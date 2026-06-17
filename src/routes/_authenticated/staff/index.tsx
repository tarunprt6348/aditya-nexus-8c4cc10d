import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRole } from "@/contexts/RoleContext";
import { ROLE_LABELS } from "@/lib/roles";
import { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];
const COLUMNS: TaskStatus[] = ["todo", "in_progress", "done"];

export const Route = createFileRoute("/_authenticated/staff/")({
  head: () => ({ meta: [{ title: "My Tasks — Staff" }] }),
  component: Tasks,
});

function Tasks() {
  const [rows, setRows] = useState<any[]>([]);
  const { role, userId } = useRole();

  const load = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("staff_tasks")
      .select("*")
      .eq("assigned_to", userId)
      .order("due_date", { ascending: true });
    setRows(data ?? []);
  };
  useEffect(() => { if (userId) load(); }, [userId]);

  async function advance(id: string, status: TaskStatus) {
    const { error } = await supabase.from("staff_tasks").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl">My Tasks</h1>
        <p className="mt-1 text-muted-foreground">
          {roleLabel} · {rows.length} tasks assigned to you
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colRows = rows.filter((r) => r.status === col);
          return (
            <div key={col}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
                  {col.replace("_", " ")}
                </h2>
                <Badge variant="outline" className="text-xs">{colRows.length}</Badge>
              </div>
              <div className="space-y-3">
                {colRows.map((t) => (
                  <Card key={t.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium">{t.title}</h3>
                      <Badge
                        variant="outline"
                        className={`capitalize text-xs ${
                          t.priority === "urgent" ? "border-red-300 text-red-600" :
                          t.priority === "high" ? "border-orange-300 text-orange-600" : ""
                        }`}
                      >
                        {t.priority}
                      </Badge>
                    </div>
                    {t.description && (
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{t.description}</p>
                    )}
                    {t.due_date && (
                      <p className={`mt-2 text-xs ${
                        new Date(t.due_date) < new Date() ? "text-red-500" : "text-muted-foreground"
                      }`}>
                        Due {new Date(t.due_date).toLocaleDateString()}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      {col !== "in_progress" && col !== "done" && (
                        <Button size="sm" variant="outline" onClick={() => advance(t.id, "in_progress")}>
                          Start
                        </Button>
                      )}
                      {col !== "done" && (
                        <Button size="sm" className="bg-navy text-white hover:bg-navy/90" onClick={() => advance(t.id, "done")}>
                          Complete
                        </Button>
                      )}
                      {col === "done" && (
                        <Button size="sm" variant="ghost" onClick={() => advance(t.id, "todo")}>
                          Reopen
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
                {colRows.length === 0 && (
                  <div className="rounded-lg border-2 border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    Nothing here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
