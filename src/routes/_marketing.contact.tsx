import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { MapPin, Phone, Mail } from "lucide-react";
import { insertContactMessage } from "@/lib/data.functions";

export const Route = createFileRoute("/_marketing/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Aditya Constructions" },
      { name: "description", content: "Talk to us about your construction, interiors, HVAC, solar or real-estate project." },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(2000),
});

function Contact() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Please complete the form.");
    setLoading(true);
    try {
      await insertContactMessage({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone || null,
          subject: parsed.data.subject || null,
          message: parsed.data.message,
        },
      });
      setDone(true);
      toast.success("Message sent. We'll reply within 24 hours.");
    } catch {
      toast.error("Couldn't send. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
      <div className="grid gap-16 lg:grid-cols-2">
        {/* Info column */}
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Get in touch</p>
          <h1 className="mt-3 font-display text-5xl">Let's talk about your project.</h1>
          <p className="mt-6 max-w-md text-muted-foreground">
            From a 200 sq ft renovation to a 20-acre township, we're ready to listen.
            Fill in the form and a senior team member will reach out within 24 hours.
          </p>
          <div className="mt-10 space-y-5 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="h-5 w-5 shrink-0 text-gold" />
              Plot 47, Hi-Tech City, Hyderabad, Telangana 500 084
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Phone className="h-5 w-5 shrink-0 text-gold" />
              +91 40 2345 6789
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="h-5 w-5 shrink-0 text-gold" />
              hello@adityaconstructions.in
            </div>
          </div>
        </div>

        {/* Form column */}
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          {done ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="font-display text-2xl">Message received</h2>
              <p className="mt-2 text-muted-foreground">We'll get back to you within 24 hours.</p>
              <Button className="mt-6" variant="outline" onClick={() => setDone(false)}>Send another</Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full name *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" />
                </div>
              </div>
              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea id="message" name="message" rows={5} required minLength={10} />
              </div>
              <Button disabled={loading} className="w-full bg-navy text-white hover:bg-navy/90">
                {loading ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
          <Toaster richColors position="top-center" />
        </div>
      </div>
    </section>
  );
}
