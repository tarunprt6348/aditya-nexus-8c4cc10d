import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_marketing/testimonials")({
  head: () => ({
    meta: [
      { title: "Testimonials — Aditya Constructions" },
      { name: "description", content: "What our clients say about working with Aditya Constructions." },
    ],
  }),
  component: Testimonials,
});

const items = [
  { n: "Rajesh Reddy", r: "Owner, Aditya Heights", q: "From the first site visit to the final handover, every commitment was kept. The build quality is genuinely better than what we were sold." },
  { n: "Priya Nair", r: "Director, Genome Valley Biopharma", q: "The HVAC team delivered an extremely complex cleanroom project on time. We've since signed an AMC for 10 years." },
  { n: "Vikram Mehta", r: "MD, Cyber Pearl Towers", q: "Aditya managed civil, MEP and interiors as one team. We saved months of coordination overhead." },
  { n: "Anjali Sharma", r: "Homeowner, Jubilee Hills", q: "Our interiors are a daily joy. The joinery is flawless and the team respected our budget down to the rupee." },
  { n: "Sundar K.", r: "Plant Head, Mahbubnagar Solar", q: "Commissioned 25 MW two weeks ahead of schedule. The monitoring dashboard has been transformative." },
  { n: "Meera Iyer", r: "Investor, Aditya Greens", q: "Clear title, prompt registration, transparent communication — exactly what I needed as an NRI buyer." },
];

function Testimonials() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <p className="text-xs uppercase tracking-widest text-gold">Testimonials</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl md:text-6xl">Reputation, earned one project at a time.</h1>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <figure key={t.n} className="relative rounded-lg border border-border bg-card p-8">
              <Quote className="h-8 w-8 text-gold/40" />
              <blockquote className="mt-4 text-sm text-foreground/90">"{t.q}"</blockquote>
              <div className="mt-6 flex items-center gap-1 text-gold">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <figcaption className="mt-4">
                <div className="font-display text-base">{t.n}</div>
                <div className="text-xs text-muted-foreground">{t.r}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
          <p className="text-xs uppercase tracking-widest text-gold">Your project, next</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Join our list of satisfied clients.</h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Tell us about your project and we'll get back to you within one business day with an
            estimated timeline and budget range.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-navy text-navy-foreground hover:bg-navy/90">
              <Link to="/quote">Start a Quote <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/projects">View our Work</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
