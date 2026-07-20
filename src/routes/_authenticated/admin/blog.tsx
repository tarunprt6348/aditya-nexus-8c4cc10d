import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PermissionGuard } from "@/components/PermissionGuard";
import { getBlogPosts, upsertBlogPost } from "@/lib/data.functions";
import type { BlogPost } from "@/lib/app-types";
import { Plus, Pencil } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/blog")({ component: BlogPage });

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [published, setPublished] = useState(false);

  async function load() {
    try { setPosts(await getBlogPosts()); }
    catch { toast.error("Failed to load posts."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setPublished(false); setOpen(true); }
  function openEdit(p: BlogPost) { setEditing(p); setPublished(p.published); setOpen(true); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    const title = fd.title as string;
    try {
      await upsertBlogPost({
        data: {
          id: editing?.id,
          title,
          slug: editing?.slug ?? slugify(title),
          excerpt: (fd.excerpt as string) || null,
          content: fd.content as string,
          cover_image: (fd.cover_image as string) || null,
          published,
          published_at: published ? new Date().toISOString() : null,
        },
      });
      toast.success(editing ? "Post updated." : "Post created.");
      setOpen(false);
      load();
    } catch { toast.error("Save failed."); }
  }

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>;

  return (
    <PermissionGuard module="blog">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl">Blog Posts</h1>
          <Button size="sm" onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> New Post</Button>
        </div>
        <div className="space-y-2">
          {posts.length === 0 && <p className="text-muted-foreground">No blog posts yet.</p>}
          {posts.map(p => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.published ? "Published" : "Draft"} · {new Date(p.created_at).toLocaleDateString()}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader><DialogTitle>{editing ? "Edit Post" : "New Post"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Title</Label><Input name="title" required defaultValue={editing?.title} /></div>
              <div><Label>Excerpt</Label><Input name="excerpt" defaultValue={editing?.excerpt ?? ""} /></div>
              <div><Label>Cover image URL</Label><Input name="cover_image" defaultValue={editing?.cover_image ?? ""} /></div>
              <div><Label>Content</Label><Textarea name="content" rows={8} required defaultValue={editing?.content} /></div>
              <div className="flex items-center gap-3">
                <Switch checked={published} onCheckedChange={setPublished} id="pub" />
                <Label htmlFor="pub">Published</Label>
              </div>
              <Button type="submit" className="w-full">{editing ? "Save" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
