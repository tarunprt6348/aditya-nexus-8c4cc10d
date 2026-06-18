import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  { t: "Residential Villa", c: "Construction · Greater Noida", img: hero, y: "2025", to: "/services/construction" },
  { t: "Commercial Showroom Fit-Out", c: "Interiors · Delhi NCR", img: interiors, y: "2025", to: "/services/interiors" },
  { t: "Society Internal CC Roads", c: "Civil Works · Greater Noida", img: construction, y: "2025", to: "/services/construction" },
  { t: "Centralised HVAC Installation", c: "HVAC · Noida", img: hvac, y: "2025", to: "/services/hvac" },
  { t: "Rooftop Solar — 50 kW", c: "Solar · Delhi NCR", img: solar, y: "2025", to: "/services/solar" },
  { t: "Plotted Development Advisory", c: "Real Estate · Greater Noida", img: realestate, y: "2025", to: "/services/real-estate" },
] as const;

function Projects() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <p className="text-xs uppercase tracking-widest text-gold">Selected works</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl md:text-6xl">A growing portfolio of integrated projects.</h1>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.t}
              to={p.to}
              className="group overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="relative h-64 overflow-hidden">
                <img src={p.img} alt={p.t} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-3 right-3 rounded-full bg-navy/80 px-3 py-1 text-xs text-gold backdrop-blur">
                  {p.y}
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl group-hover:text-navy transition-colors">{p.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.c}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-navy group-hover:text-gold transition-colors">
                  View service <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-navy py-24 text-navy-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
          <p className="text-xs uppercase tracking-widest text-gold">Start yours</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Have a project in mind?</h2>
          <p className="mx-auto mt-4 max-w-xl text-navy-foreground/75">
            Tell us about your vision and we'll respond within one business day with an estimated
            timeline and budget range.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Link to="/quote">Request a Quote <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-navy-foreground/30 bg-transparent text-navy-foreground hover:bg-navy-foreground/10">
              <Link to="/contact">Schedule a visit</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
