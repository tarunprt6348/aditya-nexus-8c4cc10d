import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_marketing/careers")({
  head: () => ({
    meta: [
      { title: "Careers — Aditya Constructions" },
      { name: "description", content: "Join 400+ engineers, designers and craftspeople building Hyderabad's most enduring addresses." },
    ],
  }),
  component: Careers,
});

const roles = [
  { t: "Senior Site Engineer (Civil)", l: "Hyderabad · Full-time" },
  { t: "Interior Designer", l: "Hyderabad · Full-time" },
  { t: "HVAC Project Manager", l: "Hyderabad · Full-time" },
  { t: "Solar EPC Engineer", l: "Mahbubnagar · Full-time" },
  { t: "Sales Consultant — Real Estate", l: "Hyderabad · Full-time" },
  { t: "Quality & Safety Officer", l: "Multiple sites · Full-time" },
];

function Careers() {
  return (
    <>
      <section className="bg-navy py-24 text-navy-foreground">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <p className="text-xs uppercase tracking-widest text-gold">Careers</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Build a career as enduring as our buildings.</h1>
          <p className="mt-6 max-w-2xl text-lg text-navy-foreground/80">
            400+ engineers, designers and craftspeople, one shared standard. We hire for ownership,
            craft and candour — and invest deeply in growing both.
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
