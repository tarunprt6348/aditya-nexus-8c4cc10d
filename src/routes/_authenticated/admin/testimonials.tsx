import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/testimonials")({
  head: () => ({ meta: [{ title: "Testimonials — Admin" }] }),
  component: Testi,
});

function Testi() {
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  async function setPublished(id: string, published: boolean) {
    const { error } = await supabase.from("testimonials").update({ published }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(published ? "Published" : "Unpublished");
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Testimonials</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {rows.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{t.client_name}</div>
                <div className="text-xs text-muted-foreground">{t.client_role || "Client"} · {"★".repeat(t.rating ?? 5)}</div>
              </div>
              <Button size="sm" variant={t.published ? "outline" : "default"} onClick={() => setPublished(t.id, !t.published)}>
                {t.published ? "Unpublish" : "Publish"}
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">"{t.content}"</p>
          </Card>
        ))}
        {rows.length === 0 && <p className="col-span-full text-center text-muted-foreground">No testimonials yet.</p>}
      </div>
    </div>
  );
}
