import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Hammer, Sparkles, Sun, Wind } from "lucide-react";
import construction from "@/assets/service-construction.jpg";
import interiors from "@/assets/service-interiors.jpg";
import hvac from "@/assets/service-hvac.jpg";
import solar from "@/assets/service-solar.jpg";
import realestate from "@/assets/service-realestate.jpg";

export const Route = createFileRoute("/_marketing/services")({
  head: () => ({
    meta: [
      { title: "Services — Aditya Constructions" },
      { name: "description", content: "Construction, interiors, HVAC, solar and real estate — five disciplines under one trusted name." },
      { property: "og:title", content: "Services — Aditya Constructions" },
      { property: "og:description", content: "Five disciplines. One standard." },
    ],
  }),
  component: Services,
});

const items = [
  { to: "/services/construction", icon: Hammer, title: "Construction", img: construction, copy: "Residential, commercial and industrial projects engineered to outlast the city around them." },
  { to: "/services/interiors", icon: Sparkles, title: "Interiors", img: interiors, copy: "Award-winning interior design and turnkey fit-outs for homes, offices and hospitality." },
  { to: "/services/hvac", icon: Wind, title: "HVAC", img: hvac, copy: "VRF, chiller and central HVAC systems, designed, installed and serviced by our in-house MEP team." },
  { to: "/services/solar", icon: Sun, title: "Solar", img: solar, copy: "Rooftop and utility-scale solar — design, installation and 25-year O&M contracts." },
  { to: "/services/real-estate", icon: Building2, title: "Real Estate", img: realestate, copy: "Premium plots, villas and apartments — RERA-registered, ready to move or pre-launch." },
] as const;

function Services() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
      <p className="text-xs uppercase tracking-widest text-gold">Services</p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl md:text-6xl">Everything you need to build, beautifully.</h1>
      <div className="mt-16 space-y-12">
        {items.map((s, i) => (
          <div key={s.title} className={`grid items-center gap-8 lg:grid-cols-2 ${i % 2 ? "lg:[&>div:first-child]:order-2" : ""}`}>
            <div className="relative h-80 overflow-hidden rounded-lg">
              <img src={s.img} alt={s.title} className="h-full w-full object-cover" />
            </div>
            <div>
              <s.icon className="h-8 w-8 text-gold" />
              <h2 className="mt-4 font-display text-3xl md:text-4xl">{s.title}</h2>
              <p className="mt-3 max-w-md text-muted-foreground">{s.copy}</p>
              <Link to={s.to} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-gold">
                Explore {s.title} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
