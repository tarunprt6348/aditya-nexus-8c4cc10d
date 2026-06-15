import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Building2, FileText, MessageSquare, LogOut } from "lucide-react";

type Role = Database["public"]["Enums"]["app_role"];

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({ meta: [{ title: "Client Portal — Aditya Constructions" }] }),
  component: Portal,
});

function Portal() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("customer");
  const [projects, setProjects] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: profile }, { data: roles }, { data: proj }, { data: tix }, { data: q }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", u.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", u.user.id),
        supabase.from("projects").select("*").eq("customer_id", u.user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("tickets").select("*").eq("customer_id", u.user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("quote_requests").select("*").eq("user_id", u.user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setName(profile?.full_name ?? u.user.email ?? "");
      const primary = (roles?.[0]?.role ?? "customer") as Role;
      setRole(primary);
      setProjects(proj ?? []);
      setTickets(tix ?? []);
      setQuotes(q ?? []);
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-sm bg-navy text-gold font-display">A</span>
            <span className="font-display">Aditya · Portal</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{name}</span>
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs uppercase tracking-widest text-gold">{role}</span>
            <Button size="sm" variant="ghost" onClick={signOut}><LogOut className="mr-1 h-4 w-4" /> Sign out</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <h1 className="font-display text-3xl">Welcome back, {name.split(" ")[0] || "there"}.</h1>
        <p className="mt-1 text-muted-foreground">Here's an overview of your projects, quotes and tickets.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-gold" /> Projects</CardTitle></CardHeader>
            <CardContent>
              <div className="font-display text-3xl">{projects.length}</div>
              <p className="text-xs text-muted-foreground">Active or completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-gold" /> Quotes</CardTitle></CardHeader>
            <CardContent>
              <div className="font-display text-3xl">{quotes.length}</div>
              <p className="text-xs text-muted-foreground">Requests on file</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4 text-gold" /> Tickets</CardTitle></CardHeader>
            <CardContent>
              <div className="font-display text-3xl">{tickets.length}</div>
              <p className="text-xs text-muted-foreground">Open conversations</p>
            </CardContent>
          </Card>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-xl">Your projects</h2>
          {projects.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              You don't have any projects yet. <Link to="/quote" className="text-gold underline">Request a quote</Link> to begin.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {projects.map((p) => (
                <Card key={p.id}>
                  <CardHeader><CardTitle className="text-base">{p.name}</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <div>Status: <span className="capitalize text-foreground">{p.status}</span></div>
                    <div>Progress: {p.progress ?? 0}%</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
      <Toaster richColors position="top-center" />
    </div>
  );
}
