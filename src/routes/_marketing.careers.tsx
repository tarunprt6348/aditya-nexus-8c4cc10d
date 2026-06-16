import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_marketing/careers")({
  head: () => ({
    meta: [
      { title: "Careers — Aditya Constructions" },
      { name: "description", content: "Join an engineering-led team delivering construction, interiors, HVAC, solar and real estate projects across Delhi NCR." },
    ],
  }),
  component: Careers,
});

const roles = [
  { t: "Senior Site Engineer (Civil)", l: "Greater Noida · Full-time" },
  { t: "Interior Designer", l: "Greater Noida · Full-time" },
  { t: "HVAC Project Manager", l: "Greater Noida · Full-time" },
  { t: "Solar EPC Engineer", l: "Delhi NCR · Full-time" },
  { t: "Sales Consultant — Real Estate", l: "Greater Noida · Full-time" },
  { t: "Quality & Safety Officer", l: "Multiple sites · Full-time" },
];

function Careers() {
  return (
    <>
      <section className="bg-navy py-24 text-navy-foreground">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <p className="text-xs uppercase tracking-widest text-gold">Careers</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Build with us.</h1>
          <p className="mt-6 max-w-2xl text-lg text-navy-foreground/80">
            We hire for ownership, craft and candour. If you take pride in detail and want to
            deliver everything-under-one-roof projects with an engineering-led team, we'd love to
            meet you.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
        <h2 className="font-display text-3xl">Open roles</h2>
        <div className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
          {roles.map((r) => (
            <div key={r.t} className="flex flex-col gap-2 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-display text-lg">{r.t}</h3>
                <p className="text-sm text-muted-foreground">{r.l}</p>
              </div>
              <Button asChild variant="outline">
                <Link to="/contact">Apply</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
