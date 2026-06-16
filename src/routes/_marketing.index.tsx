import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Award, Building2, Hammer, Home, Sparkles, Sun, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-building.jpg";
import construction from "@/assets/service-construction.jpg";
import interiors from "@/assets/service-interiors.jpg";
import hvac from "@/assets/service-hvac.jpg";
import solar from "@/assets/service-solar.jpg";
import realestate from "@/assets/service-realestate.jpg";

export const Route = createFileRoute("/_marketing/")({
  head: () => ({
    meta: [
      { title: "Aditya Constructions — Everything Under One Roof" },
      { name: "description", content: "Construction, interiors, real estate, HVAC and solar — comprehensive solutions from Greater Noida, delivered with engineering precision and timely execution." },
      { property: "og:title", content: "Aditya Constructions" },
      { property: "og:description", content: "Everything under one roof — construction, interiors, HVAC, solar and real estate." },
      { property: "og:image", content: hero },
    ],
  }),
  component: Home_,
});

const services = [
  { to: "/services/construction", icon: Hammer, title: "Construction", img: construction, copy: "Residential, commercial, industrial and institutional builds, engineered to last." },
  { to: "/services/interiors", icon: Sparkles, title: "Interiors", img: interiors, copy: "Modular kitchens, wardrobes, false ceilings and turnkey interior fit-outs." },
  { to: "/services/hvac", icon: Wind, title: "HVAC", img: hvac, copy: "VRV/VRF, central AC, ducting and ventilation — design, install, maintain." },
  { to: "/services/solar", icon: Sun, title: "Solar", img: solar, copy: "Rooftop solar systems for homes and businesses, plus O&M." },
  { to: "/services/real-estate", icon: Building2, title: "Real Estate", img: realestate, copy: "Sale, purchase, rental, advisory and investment guidance." },
] as const;

const stats = [
  { v: "On-time", l: "Delivery commitment" },
  { v: "Turnkey", l: "End-to-end execution" },
  { v: "Integrated", l: "All trades, one team" },
  { v: "Transparent", l: "Costed, time-bound" },
];

function Home_() {
  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-navy text-navy-foreground">
        <div className="absolute inset-0">
          <img src={hero} alt="Aditya Constructions landmark project" className="h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/85 to-navy/40" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-24 lg:grid-cols-12 lg:px-8 lg:py-36">
          <div className="lg:col-span-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs uppercase tracking-widest text-gold">
              <Award className="h-3.5 w-3.5" /> Greater Noida · Everything Under One Roof
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              We build spaces <span className="text-gold">that last</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-navy-foreground/80">
              Construction, interiors, real estate, HVAC and solar — Aditya Constructions delivers
              integrated, professionally-managed projects for residential, commercial, industrial
              and institutional clients.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Link to="/quote">Request a Quote <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-navy-foreground/30 bg-transparent text-navy-foreground hover:bg-navy-foreground/10">
                <Link to="/projects">View Projects</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="relative border-t border-navy-foreground/10">
          <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 py-8 lg:grid-cols-4 lg:px-8">
            {stats.map((s) => (
              <div key={s.l} className="px-4 py-2">
                <div className="font-display text-3xl text-gold md:text-4xl">{s.v}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-navy-foreground/60">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">What we do</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">Five disciplines. One standard.</h2>
          </div>
          <p className="max-w-md text-muted-foreground">
            A vertically integrated team means every detail — from foundation to finishing — is
            engineered and accountable in-house.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Link
              key={s.title}
              to={s.to}
              className={`group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-[var(--shadow-elegant)] ${i === 0 ? "lg:col-span-2 lg:row-span-2" : ""}`}
            >
              <div className={`relative ${i === 0 ? "h-96" : "h-56"} overflow-hidden`}>
                <img src={s.img} alt={s.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6 text-navy-foreground">
                <div className="flex items-center gap-2 text-gold">
                  <s.icon className="h-5 w-5" />
                  <span className="text-xs uppercase tracking-widest">Service</span>
                </div>
                <h3 className="mt-2 font-display text-2xl">{s.title}</h3>
                <p className="mt-1 text-sm text-navy-foreground/80">{s.copy}</p>
                <div className="mt-3 inline-flex items-center gap-2 text-sm text-gold">
                  Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="bg-muted/40 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">Why Aditya</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">A quieter way to build something extraordinary.</h2>
            <p className="mt-6 text-muted-foreground">
              We treat every project as a 30-year promise. That means transparent timelines,
              certified materials, in-house quality control, and a single point of accountability
              from blueprint to handover.
            </p>
            <div className="mt-8 flex gap-3">
              <Button asChild className="bg-navy text-navy-foreground hover:bg-navy/90">
                <Link to="/about">Our story</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact">Talk to us</Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { t: "Certified", d: "ISO 9001:2015, RERA registered, NABL tested materials." },
              { t: "Transparent", d: "Real-time project tracking via your client portal." },
              { t: "Integrated", d: "Civil, MEP, interiors and finishing under one roof." },
              { t: "On-time", d: "98% projects delivered on or ahead of schedule." },
            ].map((b) => (
              <div key={b.t} className="rounded-lg border border-border bg-card p-6">
                <Home className="h-5 w-5 text-gold" />
                <h3 className="mt-3 font-display text-lg">{b.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-navy py-24 text-navy-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
          <h2 className="font-display text-4xl md:text-5xl">Have a project in mind?</h2>
          <p className="mx-auto mt-4 max-w-xl text-navy-foreground/75">
            Tell us about your vision. Our team will respond within one business day with an
            estimated timeline and budget range.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Link to="/quote">Start a quote</Link>
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
