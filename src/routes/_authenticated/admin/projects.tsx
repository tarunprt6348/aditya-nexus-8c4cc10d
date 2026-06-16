import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type Service = Database["public"]["Enums"]["service_type"];
type Status = Database["public"]["Enums"]["project_status"];
const SERVICES: Service[] = ["construction", "interiors", "real_estate", "hvac", "solar"];
const STATUSES: Status[] = ["planning", "in_progress", "on_hold", "completed", "cancelled"];

export const Route = createFileRoute("/_authenticated/admin/projects")({
  head: () => ({ meta: [{ title: "Projects — Owner" }] }),
  component: Projects,
});

type Draft = {
  id?: string;
  title: string;
  service_type: Service;
  status: Status;
  progress: number;
  description: string;
  location: string;
  budget: string;
  start_date: string;
  end_date: string;
};

const empty: Draft = {
  title: "",
  service_type: "construction",
  status: "planning",
  progress: 0,
  description: "",
  location: "Greater Noida",
  budget: "",
  start_date: "",
  end_date: "",
};

function Projects() {
  const [rows, setRows] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  function startNew() { setDraft(empty); setOpen(true); }
  function startEdit(p: Project) {
    setDraft({
      id: p.id,
      title: p.title,
      service_type: p.service_type,
      status: p.status,
      progress: p.progress ?? 0,
      description: p.description ?? "",
      location: p.location ?? "",
      budget: p.budget?.toString() ?? "",
      start_date: p.start_date ?? "",
      end_date: p.end_date ?? "",
    });
    setOpen(true);
  }

  async function save() {
    if (!draft.title.trim()) return toast.error("Title is required.");
    setSaving(true);
    const payload = {
      title: draft.title.trim(),
      service_type: draft.service_type,
      status: draft.status,
      progress: Math.min(100, Math.max(0, Number(draft.progress) || 0)),
      description: draft.description || null,
      location: draft.location || null,
      budget: draft.budget ? Number(draft.budget) : null,
      start_date: draft.start_date || null,
      end_date: draft.end_date || null,
    };
    const { error } = draft.id
      ? await supabase.from("projects").update(payload).eq("id", draft.id)
      : await supabase.from("projects").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(draft.id ? "Project updated" : "Project created");
    setOpen(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this project?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Projects</h1>
          <p className="mt-1 text-muted-foreground">{rows.length} total</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={startNew} className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Plus className="mr-2 h-4 w-4" /> New project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{draft.id ? "Edit project" : "New project"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Title</Label>
                <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </div>
              <div>
                <Label>Service</Label>
                <Select value={draft.service_type} onValueChange={(v) => setDraft({ ...draft, service_type: v as Service })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SERVICES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
              </div>
              <div>
                <Label>Budget (₹)</Label>
                <Input type="number" value={draft.budget} onChange={(e) => setDraft({ ...draft, budget: e.target.value })} />
              </div>
              <div>
                <Label>Start date</Label>
                <Input type="date" value={draft.start_date} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} />
              </div>
              <div>
                <Label>End date</Label>
                <Input type="date" value={draft.end_date} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Progress (%)</Label>
                <Input type="number" min={0} max={100} value={draft.progress} onChange={(e) => setDraft({ ...draft, progress: Number(e.target.value) })} />
              </div>
              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-navy text-navy-foreground hover:bg-navy/90">
                {saving ? "Saving…" : draft.id ? "Save changes" : "Create project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {rows.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg">{p.title}</h3>
              <Badge className="capitalize">{p.status}</Badge>
            </div>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{p.service_type?.replace("_", " ")}{p.location ? ` · ${p.location}` : ""}</p>
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{p.progress ?? 0}%</span></div>
              <Progress value={p.progress ?? 0} />
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => startEdit(p)}><Pencil className="mr-1 h-3 w-3" /> Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>Delete</Button>
            </div>
          </Card>
        ))}
        {rows.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No projects yet. Click <strong>New project</strong> to add your first one.
          </div>
        )}
      </div>
    </div>
  );
}
