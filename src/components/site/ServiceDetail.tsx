import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  eyebrow: string;
  title: string;
  intro: string;
  image: string;
  features: string[];
  process: { t: string; d: string }[];
}

export function ServiceDetail({ eyebrow, title, intro, image, features, process }: Props) {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy py-24 text-navy-foreground">
        <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/90 to-navy/50" />
        <div className="relative mx-auto max-w-5xl px-4 lg:px-8">
          <p className="text-xs uppercase tracking-widest text-gold">{eyebrow}</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg text-navy-foreground/80">{intro}</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 lg:px-8">
        <div>
          <h2 className="font-display text-3xl">What's included</h2>
          <ul className="mt-6 space-y-3">
            {features.map((f) => (
              <li key={f} className="flex gap-3 text-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-gold" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-card p-8">
          <h3 className="font-display text-xl">Ready to begin?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Share your brief and we'll send a costed proposal within 48 hours.
          </p>
          <Button asChild size="lg" className="mt-6 w-full bg-gold text-gold-foreground hover:bg-gold/90">
            <Link to="/quote">Request a quote <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link to="/contact">Schedule a site visit</Link>
          </Button>
        </div>
      </section>
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <h2 className="font-display text-3xl">Our process</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {process.map((p, i) => (
              <div key={p.t} className="rounded-lg border border-border bg-card p-6">
                <div className="font-display text-3xl text-gold">0{i + 1}</div>
                <h3 className="mt-2 font-display text-lg">{p.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
