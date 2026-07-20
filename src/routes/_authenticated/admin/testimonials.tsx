import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { PermissionGuard } from "@/components/PermissionGuard";
import { getTestimonials, updateTestimonialPublished } from "@/lib/data.functions";
import type { Testimonial } from "@/lib/app-types";
import { Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/testimonials")({ component: TestimonialsPage });

function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTestimonials().then(setTestimonials).catch(() => toast.error("Failed to load.")).finally(() => setLoading(false));
  }, []);

  async function toggle(id: string, published: boolean) {
    try {
      await updateTestimonialPublished({ data: { id, published } });
      setTestimonials(prev => prev.map(t => t.id === id ? { ...t, published } : t));
      toast.success(published ? "Published." : "Unpublished.");
    } catch { toast.error("Update failed."); }
  }

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>;

  return (
    <PermissionGuard module="testimonials">
      <div className="p-6">
        <h1 className="mb-6 font-display text-2xl">Testimonials</h1>
        <div className="space-y-3">
          {testimonials.length === 0 && <p className="text-muted-foreground">No testimonials.</p>}
          {testimonials.map(t => (
            <div key={t.id} className="flex items-start gap-4 rounded-lg border bg-card p-4">
              <div className="flex-1">
                <div className="flex items-center gap-1 text-gold">
                  {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                </div>
                <p className="mt-1 text-sm">"{t.content}"</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.client_name}{t.client_role ? ` — ${t.client_role}` : ""}{t.company ? `, ${t.company}` : ""}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Switch checked={t.published} onCheckedChange={v => toggle(t.id, v)} />
                <span className="text-xs text-muted-foreground">{t.published ? "Live" : "Hidden"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PermissionGuard>
  );
}
