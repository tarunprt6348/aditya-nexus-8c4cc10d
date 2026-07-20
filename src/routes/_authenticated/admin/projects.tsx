import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PermissionGuard } from "@/components/PermissionGuard";
import { getProjects, upsertProject, deleteProject } from "@/lib/data.functions";
import type { Project, ProjectStatus, ServiceType } from "@/lib/app-types";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/projects")({ component: ProjectsPage });

const SERVICE_OPTIONS: ServiceType[] = ["construction", "interiors", "real_estate", "hvac", "solar"];
const STATUS_OPTIONS: ProjectStatus[] = ["planning", "in_progress", "on_hold", "completed", "cancelled"];

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [serviceType, setServiceType] = useState<string>("");
  const [statusType, setStatusType] = useState<string>("planning");

  async function load() {
    try {
      setProjects(await getProjects());
    } catch {
      toast.error("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setServiceType("");
    setStatusType("planning");
    setOpen(true);
  }

  function openEdit(p: Project) {
    setEditing(p);
    setServiceType(p.service_type);
    setStatusType(p.status);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await upsertProject({
        data: {
          id: editing?.id,
          title: fd.title as string,
          service_type: serviceType,
          status: statusType,
          progress: Number(fd.progress ?? 0),
          description: fd.description as string || null,
          location: fd.location as string || null,
          budget: fd.budget ? Number(fd.budget) : null,
          start_date: fd.start_date as string || null,
          end_date: fd.end_date as string || null,
        },
      });
      toast.success(editing ? "Project updated." : "Project created.");
      setOpen(false);
      load();
    } catch {
      toast.error("Save failed.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project?")) return;
    try {
      await deleteProject({ data: { id } });
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success("Project deleted.");
    } catch {
      toast.error("Delete failed.");
    }
  }

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>;

  return (
    <PermissionGuard module="projects">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl">Projects</h1>
          <Button size="sm" onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.length === 0 && (
            <p className="col-span-full text-muted-foreground">No projects yet.</p>
          )}
          {projects.map(p => (
            <div key={p.id} className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-medium">{p.title}</h3>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{p.service_type} · {p.location ?? "—"}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${p.progress}%` }} />
                </div>
                <span className="text-xs">{p.progress}%</span>
              </div>
              <p className="mt-1 text-xs capitalize text-muted-foreground">{p.status.replace("_", " ")}</p>
            </div>
          ))}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Project" : "New Project"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input name="title" required defaultValue={editing?.title} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Service</Label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={statusType} onValueChange={setStatusType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Progress (%)</Label>
                <Input name="progress" type="number" min={0} max={100} defaultValue={editing?.progress ?? 0} />
              </div>
              <div>
                <Label>Location</Label>
                <Input name="location" defaultValue={editing?.location ?? ""} />
              </div>
              <div>
                <Label>Budget (₹)</Label>
                <Input name="budget" type="number" defaultValue={editing?.budget ?? ""} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start date</Label>
                  <Input name="start_date" type="date" defaultValue={editing?.start_date?.split("T")[0] ?? ""} />
                </div>
                <div>
                  <Label>End date</Label>
                  <Input name="end_date" type="date" defaultValue={editing?.end_date?.split("T")[0] ?? ""} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea name="description" defaultValue={editing?.description ?? ""} />
              </div>
              <Button type="submit" className="w-full">{editing ? "Save changes" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
