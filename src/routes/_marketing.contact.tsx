import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_marketing/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Aditya Constructions" },
      { name: "description", content: "Talk to Aditya Constructions. We respond within one business day." },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(20).optional().or(z.literal("")),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(10).max(2000),
});

function Contact() {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your inputs.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });
    setLoading(false);
    if (error) return toast.error("Couldn't send. Please try again.");
    toast.success("Thanks! We'll be in touch within one business day.");
    e.currentTarget.reset();
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
      <div className="grid gap-16 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Contact</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Let's build something lasting.</h1>
          <p className="mt-6 max-w-md text-muted-foreground">
            Tell us about your project. A senior team member will reply within one business day —
            no junior gatekeeping.
          </p>
          <dl className="mt-10 space-y-5 text-sm">
            <div className="flex gap-4">
              <MapPin className="h-5 w-5 text-gold" />
              <div>
                <dt className="font-semibold">Office</dt>
                <dd className="text-muted-foreground">T-22 & 23, Beta Plaza, Beta-1, Greater Noida, U.P. 201310</dd>
              </div>
            </div>
            <div className="flex gap-4">
              <Phone className="h-5 w-5 text-gold" />
              <div>
                <dt className="font-semibold">Call</dt>
                <dd className="text-muted-foreground">+91 96509 98403 · Mon–Sat, 9am–7pm</dd>
              </div>
            </div>
            <div className="flex gap-4">
              <Mail className="h-5 w-5 text-gold" />
              <div>
                <dt className="font-semibold">Email</dt>
                <dd className="text-muted-foreground">adityaconstructionsfirm@gmail.com</dd>
              </div>
            </div>
          </dl>
        </div>
        <form onSubmit={onSubmit} className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required maxLength={100} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required maxLength={255} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" name="phone" type="tel" maxLength={20} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" required maxLength={200} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" required rows={5} maxLength={2000} />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="mt-6 w-full bg-navy text-navy-foreground hover:bg-navy/90">
            {loading ? "Sending…" : "Send message"}
          </Button>
        </form>
      </div>
    </section>
  );
}
