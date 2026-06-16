import { createFileRoute } from "@tanstack/react-router";
import hero from "@/assets/hero-building.jpg";
import construction from "@/assets/service-construction.jpg";
import interiors from "@/assets/service-interiors.jpg";
import solar from "@/assets/service-solar.jpg";
import realestate from "@/assets/service-realestate.jpg";
import hvac from "@/assets/service-hvac.jpg";

export const Route = createFileRoute("/_marketing/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Aditya Constructions" },
      { name: "description", content: "Selected works across construction, interiors, HVAC, solar and real estate." },
      { property: "og:image", content: hero },
    ],
  }),
  component: Projects,
});

const projects = [
  { t: "Residential Villa", c: "Construction · Greater Noida", img: hero, y: "2025" },
  { t: "Commercial Showroom Fit-Out", c: "Interiors · Delhi NCR", img: interiors, y: "2025" },
  { t: "Society Internal CC Roads", c: "Civil Works · Greater Noida", img: construction, y: "2025" },
  { t: "Centralised HVAC Installation", c: "HVAC · Noida", img: hvac, y: "2025" },
  { t: "Rooftop Solar — 50 kW", c: "Solar · Delhi NCR", img: solar, y: "2025" },
  { t: "Plotted Development Advisory", c: "Real Estate · Greater Noida", img: realestate, y: "2025" },
];

function Projects() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
      <p className="text-xs uppercase tracking-widest text-gold">Selected works</p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl md:text-6xl">A growing portfolio of integrated projects.</h1>
      <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <article key={p.t} className="group overflow-hidden rounded-lg border border-border bg-card">
            <div className="relative h-64 overflow-hidden">
              <img src={p.img} alt={p.t} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute top-3 right-3 rounded-full bg-navy/80 px-3 py-1 text-xs text-gold backdrop-blur">
                {p.y}
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl">{p.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.c}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
