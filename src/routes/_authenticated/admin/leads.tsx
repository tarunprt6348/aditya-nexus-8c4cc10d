import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/PermissionGuard";
import { getLeads, updateLeadStatus } from "@/lib/data.functions";
import type { Lead, LeadStatus } from "@/lib/app-types";

export const Route = createFileRoute("/_authenticated/admin/leads")({ component: LeadsPage });

const STATUS_OPTIONS: LeadStatus[] = ["new", "contacted", "qualified", "converted", "lost"];

const STATUS_COLOR: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-purple-100 text-purple-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    try {
      const data = await getLeads();
      setLeads(data);
    } catch {
      toast.error("Failed to load leads.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleStatusChange(id: string, status: LeadStatus) {
    setUpdating(id);
    try {
      await updateLeadStatus({ data: { id, status } });
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      toast.success("Status updated.");
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setUpdating(null);
    }
  }

  if (loading) return <p className="p-6 text-muted-foreground">Loading leads…</p>;

  return (
    <PermissionGuard module="leads">
      <div className="p-6">
        <h1 className="mb-6 font-display text-2xl">Leads</h1>
        <div className="rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Service</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No leads yet.</td></tr>
              )}
              {leads.map(lead => (
                <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{lead.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.email}</td>
                  <td className="px-4 py-3">{lead.service ?? "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      disabled={updating === lead.id}
                      onChange={e => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                      className="rounded border bg-background px-2 py-1 text-xs"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString()}
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
