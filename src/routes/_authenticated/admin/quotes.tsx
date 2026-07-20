import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/PermissionGuard";
import { getQuoteRequests, updateQuoteStatus } from "@/lib/data.functions";
import type { QuoteRequest, QuoteStatus } from "@/lib/app-types";

export const Route = createFileRoute("/_authenticated/admin/quotes")({ component: QuotesPage });

const STATUS_OPTIONS: QuoteStatus[] = ["pending", "reviewing", "quoted", "accepted", "rejected"];

function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setQuotes(await getQuoteRequests());
    } catch {
      toast.error("Failed to load quotes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleStatus(id: string, status: QuoteStatus) {
    try {
      await updateQuoteStatus({ data: { id, status } });
      setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
      toast.success("Status updated.");
    } catch {
      toast.error("Update failed.");
    }
  }

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>;

  return (
    <PermissionGuard module="quotes">
      <div className="p-6">
        <h1 className="mb-6 font-display text-2xl">Quote Requests</h1>
        <div className="rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Service</th>
                <th className="px-4 py-3 text-left">Budget</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No quote requests.</td></tr>
              )}
              {quotes.map(q => (
                <tr key={q.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{q.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{q.email}</td>
                  <td className="px-4 py-3">{q.service_type ?? "—"}</td>
                  <td className="px-4 py-3">{q.budget_range ?? "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={q.status}
                      onChange={e => handleStatus(q.id, e.target.value as QuoteStatus)}
                      className="rounded border bg-background px-2 py-1 text-xs"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(q.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PermissionGuard>
  );
}
