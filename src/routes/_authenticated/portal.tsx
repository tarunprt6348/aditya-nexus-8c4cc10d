import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRole } from "@/contexts/RoleContext";
import {
  getMyProfile, getMyProjects, getMyTickets, getMyQuoteRequests,
} from "@/lib/data.functions";
import type { Profile, Project, Ticket, QuoteRequest } from "@/lib/app-types";
import { FolderOpen, LifeBuoy, FileText, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal")({ ssr: false, component: Portal });

function Portal() {
  const { email } = useRole();
  const [profile, setProfile] = useState<(Profile & { email: string | null }) | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyProfile(), getMyProjects(), getMyTickets(), getMyQuoteRequests()])
      .then(([p, pr, t, q]) => {
        setProfile(p);
        setProjects(pr);
        setTickets(t);
        setQuotes(q);
      })
      .catch(() => toast.error("Failed to load portal data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center"><p className="text-muted-foreground">Loading your portal…</p></div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy font-display text-2xl font-bold text-white">
          {(profile?.full_name ?? email ?? "U")[0].toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-2xl">Welcome, {profile?.full_name?.split(" ")[0] ?? "there"}</h1>
          <p className="text-sm text-muted-foreground">{profile?.email ?? email}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={FolderOpen} label="Active projects" value={projects.filter(p => p.status === "in_progress").length} />
        <SummaryCard icon={LifeBuoy} label="Open tickets" value={tickets.filter(t => t.status !== "closed").length} />
        <SummaryCard icon={FileText} label="Quote requests" value={quotes.length} />
      </div>

      {/* Projects */}
      <Section title="Your Projects">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects linked to your account yet.</p>
        ) : (
          <div className="space-y-2">
            {projects.map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs capitalize text-muted-foreground">{p.service_type} · {p.location ?? "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-24 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${p.progress}%` }} />
                  </div>
                  <span className="text-xs">{p.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Tickets */}
      <Section title="Support Tickets">
        {tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No support tickets.</p>
        ) : (
          <div className="space-y-2">
            {tickets.map(t => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <div>
                  <p className="font-medium">{t.subject}</p>
                  <p className="text-xs capitalize text-muted-foreground">{t.priority} priority</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${t.status === "open" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}>
                  {t.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Quotes */}
      <Section title="Quote Requests">
        {quotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No quote requests.</p>
        ) : (
          <div className="space-y-2">
            {quotes.map(q => (
              <div key={q.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <div>
                  <p className="font-medium capitalize">{q.service_type?.replace("_", " ") ?? "Service"} quote</p>
                  <p className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${q.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                  {q.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10">
        <Icon className="h-5 w-5 text-navy" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </div>
  );
}
