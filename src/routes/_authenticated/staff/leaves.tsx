import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMyLeaves, insertLeave } from "@/lib/data.functions";
import type { StaffLeave } from "@/lib/app-types";
import { PlusCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/staff/leaves")({ component: LeavesPage });

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

function LeavesPage() {
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [leaveType, setLeaveType] = useState("casual");

  async function load() {
    try { setLeaves(await getMyLeaves()); }
    catch { toast.error("Failed to load leave requests."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    setSubmitting(true);
    try {
      await insertLeave({
        data: {
          from_date: fd.from_date as string,
          to_date: fd.to_date as string,
          leave_type: leaveType,
          reason: (fd.reason as string) || null,
        },
      });
      toast.success("Leave request submitted.");
      (e.target as HTMLFormElement).reset();
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Submission failed.");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 font-display text-2xl">My Leave Requests</h1>
      <div className="mb-8 rounded-lg border bg-card p-6">
        <h2 className="mb-4 font-semibold">Apply for Leave</h2>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>From</Label>
            <Input name="from_date" type="date" required />
          </div>
          <div>
            <Label>To</Label>
            <Input name="to_date" type="date" required />
          </div>
          <div>
            <Label>Leave type</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="sick">Sick</SelectItem>
                <SelectItem value="earned">Earned</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reason (optional)</Label>
            <Input name="reason" placeholder="Short description…" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              {submitting ? "Submitting…" : "Submit request"}
            </Button>
          </div>
        </form>
      </div>

      <h2 className="mb-3 font-semibold">Leave History</h2>
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : leaves.length === 0 ? (
        <p className="text-muted-foreground">No leave requests.</p>
      ) : (
        <div className="space-y-2">
          {leaves.map(l => (
            <div key={l.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium capitalize">{l.leave_type} leave — {l.from_date} to {l.to_date}</p>
                {l.reason && <p className="text-xs text-muted-foreground">{l.reason}</p>}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLOR[l.status] ?? "bg-gray-100 text-gray-600"}`}>
                {l.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
