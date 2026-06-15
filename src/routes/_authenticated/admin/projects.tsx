import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/projects")({
  head: () => ({ meta: [{ title: "Projects — Admin" }] }),
  component: Projects,
});

function Projects() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      setRows(data ?? []);
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl">Projects</h1>
      <p className="mt-1 text-muted-foreground">{rows.length} total</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {rows.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg">{p.name}</h3>
              <Badge className="capitalize">{p.status}</Badge>
            </div>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{p.service_type?.replace("_", " ")}</p>
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{p.progress ?? 0}%</span></div>
              <Progress value={p.progress ?? 0} />
            </div>
          </Card>
        ))}
        {rows.length === 0 && <p className="col-span-full text-center text-muted-foreground">No projects yet.</p>}
      </div>
    </div>
  );
}
