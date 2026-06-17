import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { PermissionGuard } from "@/components/site/PermissionGuard";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  head: () => ({ meta: [{ title: "Blog — Owner" }] }),
  component: () => <PermissionGuard module="blog"><Blog /></PermissionGuard>,
});

function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

function Blog() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ id: "" as string | "", title: "", excerpt: "", content: "", cover_image: "", published: false });
  const load = async () => {
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  async function save() {
    if (!draft.title.trim() || !draft.content.trim()) return toast.error("Title and content are required.");
    const payload: any = {
      title: draft.title.trim(),
      slug: slugify(draft.title),
      excerpt: draft.excerpt || null,
      content: draft.content,
      cover_image: draft.cover_image || null,
      published: draft.published,
      published_at: draft.published ? new Date().toISOString() : null,
    };
    const { error } = draft.id
      ? await supabase.from("blog_posts").update(payload).eq("id", draft.id)
      : await supabase.from("blog_posts").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setOpen(false);
    setDraft({ id: "", title: "", excerpt: "", content: "", cover_image: "", published: false });
    load();
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl">Blog</h1>
          <p className="mt-1 text-muted-foreground">{rows.length} posts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDraft({ id: "", title: "", excerpt: "", content: "", cover_image: "", published: false })}>
              <Plus className="mr-2 h-4 w-4" /> New post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{draft.id ? "Edit post" : "New post"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
              <div><Label>Excerpt</Label><Input value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} /></div>
              <div><Label>Cover image URL</Label><Input value={draft.cover_image} onChange={(e) => setDraft({ ...draft, cover_image: e.target.value })} /></div>
              <div><Label>Content (Markdown)</Label><Textarea rows={10} value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> Publish immediately</label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} className="bg-navy text-navy-foreground hover:bg-navy/90">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-6 grid gap-3">
        {rows.map((p) => (
          <Card key={p.id} className="flex items-start justify-between p-5">
            <div>
              <h3 className="font-medium">{p.title} {p.published ? <span className="ml-2 rounded bg-gold/15 px-2 py-0.5 text-xs text-gold">Live</span> : <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs">Draft</span>}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.excerpt}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setDraft({ id: p.id, title: p.title, excerpt: p.excerpt ?? "", content: p.content, cover_image: p.cover_image ?? "", published: p.published }); setOpen(true); }}>Edit</Button>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-center text-muted-foreground">No posts yet.</p>}
      </div>
    </div>
  );
}
