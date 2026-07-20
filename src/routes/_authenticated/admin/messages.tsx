import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PermissionGuard } from "@/components/PermissionGuard";
import { getContactMessages, updateContactMessageHandled } from "@/lib/data.functions";
import type { ContactMessage } from "@/lib/app-types";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/messages")({ component: MessagesPage });

function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContactMessages().then(setMessages).catch(() => toast.error("Failed to load messages.")).finally(() => setLoading(false));
  }, []);

  async function markHandled(id: string, handled: boolean) {
    try {
      await updateContactMessageHandled({ data: { id, handled } });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, handled } : m));
      toast.success(handled ? "Marked handled." : "Reopened.");
    } catch { toast.error("Update failed."); }
  }

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>;

  return (
    <PermissionGuard module="messages">
      <div className="p-6">
        <h1 className="mb-6 font-display text-2xl">Contact Messages</h1>
        <div className="space-y-3">
          {messages.length === 0 && <p className="text-muted-foreground">No messages.</p>}
          {messages.map(m => (
            <div key={m.id} className={`rounded-lg border bg-card p-4 ${m.handled ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{m.name}</p>
                    <span className="text-xs text-muted-foreground">{m.email}</span>
                    {m.phone && <span className="text-xs text-muted-foreground">{m.phone}</span>}
                  </div>
                  {m.subject && <p className="mt-0.5 text-sm font-medium text-muted-foreground">{m.subject}</p>}
                  <p className="mt-2 text-sm">{m.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
                </div>
                <Button
                  size="sm"
                  variant={m.handled ? "outline" : "default"}
                  onClick={() => markHandled(m.id, !m.handled)}
                  className="shrink-0 gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  {m.handled ? "Reopen" : "Mark handled"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PermissionGuard>
  );
}
