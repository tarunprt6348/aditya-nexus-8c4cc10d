import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { AiQuoteAssistant } from "@/components/site/AiQuoteAssistant";

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
    const { error } = await supabase.from("quote_requests").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      service_type: parsed.data.service_type,
      budget_range: parsed.data.budget_range || null,
      timeline: parsed.data.timeline || null,
      location: parsed.data.location || null,
      requirements: parsed.data.requirements,
    });
    setLoading(false);
    if (error) return toast.error("Couldn't submit. Please try again.");
    toast.success("Thank you. A senior team member will reach out within 48 hours.");
    e.currentTarget.reset();
    setService("");
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-20 lg:px-8">
      <p className="text-xs uppercase tracking-widest text-gold">Request a quote</p>
      <h1 className="mt-3 font-display text-5xl md:text-6xl">Tell us about your project.</h1>
      <p className="mt-6 max-w-2xl text-muted-foreground">
        Share a few details and we'll send a costed, time-bound proposal within 48 hours.
        Everything you tell us is kept strictly confidential.
      </p>
      <div className="mt-12"><AiQuoteAssistant /></div>

      <form onSubmit={onSubmit} className="mt-12 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" required maxLength={100} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required maxLength={255} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" required maxLength={20} />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="Greater Noida" maxLength={100} />
          </div>
          <div>
            <Label>Service</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="interiors">Interiors</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="solar">Solar</SelectItem>
                <SelectItem value="real_estate">Real Estate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="budget_range">Budget range</Label>
            <Input id="budget_range" name="budget_range" placeholder="e.g. ₹50L – ₹1Cr" maxLength={100} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="timeline">Preferred timeline</Label>
            <Input id="timeline" name="timeline" placeholder="e.g. Start in 3 months" maxLength={100} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="requirements">Project details</Label>
            <Textarea id="requirements" name="requirements" required rows={6} maxLength={2000}
              placeholder="Site, scope, design brief, any constraints…" />
          </div>
        </div>
        <Button type="submit" disabled={loading || !service}
          className="mt-6 w-full bg-gold text-gold-foreground hover:bg-gold/90">
          {loading ? "Submitting…" : "Request my quote"}
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          We respond within 48 hours. By submitting you agree to our terms.
        </p>
      </form>
    </section>
  );
}
