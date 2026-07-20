import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AiQuoteAssistant } from "@/components/site/AiQuoteAssistant";
import { insertQuoteRequest } from "@/lib/data.functions";

export const Route = createFileRoute("/_marketing/quote")({
  head: () => ({
    meta: [
      { title: "Request a Quote — Aditya Constructions" },
      { name: "description", content: "Tell us about your project and get a costed proposal within 48 hours." },
    ],
  }),
  component: Quote,
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(20),
  service_type: z.enum(["construction", "interiors", "hvac", "solar", "real_estate"]),
  budget_range: z.string().trim().max(100).optional().or(z.literal("")),
  timeline: z.string().trim().max(100).optional().or(z.literal("")),
  location: z.string().trim().max(100).optional().or(z.literal("")),
  requirements: z.string().trim().min(10).max(2000),
});

function Quote() {
  const [loading, setLoading] = useState(false);
  const [service, setService] = useState<string>("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("service_type", service);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please complete all required fields.");
      return;
    }
    setLoading(true);
    try {
      await insertQuoteRequest({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          service_type: parsed.data.service_type,
          budget_range: parsed.data.budget_range || null,
          timeline: parsed.data.timeline || null,
          location: parsed.data.location || null,
          requirements: parsed.data.requirements,
        },
      });
      setDone(true);
      toast.success("Thank you. A senior team member will reach out within 48 hours.");
    } catch {
      toast.error("Couldn't submit. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-32 text-center">
        <h1 className="font-display text-4xl">Quote request received</h1>
        <p className="mt-4 text-muted-foreground">We'll prepare a detailed proposal and reach out within 48 hours.</p>
        <Button className="mt-8" variant="outline" onClick={() => { setDone(false); setService(""); }}>Submit another</Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <p className="text-xs uppercase tracking-widest text-gold">Project enquiry</p>
      <h1 className="mt-3 font-display text-5xl">Request a quote.</h1>
      <p className="mt-4 text-muted-foreground">
        Tell us about your project and we'll prepare a detailed proposal within 48 hours.
        Use the AI assistant below to help estimate your budget.
      </p>

      <div className="mt-10 rounded-xl border bg-card p-8">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="name">Name *</Label><Input id="name" name="name" required /></div>
            <div><Label htmlFor="email">Email *</Label><Input id="email" name="email" type="email" required /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="phone">Phone *</Label><Input id="phone" name="phone" type="tel" required /></div>
            <div>
              <Label>Service *</Label>
              <Select value={service} onValueChange={setService}>
                <SelectTrigger><SelectValue placeholder="Select a service…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="interiors">Interiors</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="solar">Solar</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label htmlFor="budget_range">Budget range</Label><Input id="budget_range" name="budget_range" placeholder="e.g. ₹50–80 L" /></div>
            <div><Label htmlFor="timeline">Timeline</Label><Input id="timeline" name="timeline" placeholder="e.g. 8 months" /></div>
            <div><Label htmlFor="location">Location</Label><Input id="location" name="location" placeholder="City / area" /></div>
          </div>
          <div>
            <Label htmlFor="requirements">Project requirements *</Label>
            <Textarea id="requirements" name="requirements" rows={5} required minLength={10}
              placeholder="Describe your project: scope, area, specific requirements…" />
          </div>
          <Button disabled={loading || !service} className="w-full bg-navy text-white hover:bg-navy/90">
            {loading ? "Submitting…" : "Submit enquiry"}
          </Button>
        </form>
      </div>

      <div className="mt-12">
        <AiQuoteAssistant />
      </div>
    </section>
  );
}
