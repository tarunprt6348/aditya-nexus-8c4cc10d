import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_marketing/about")({
  head: () => ({
    meta: [
      { title: "About — Aditya Constructions" },
      { name: "description", content: "25 years of building Hyderabad's most enduring addresses. Meet the team and the values behind Aditya Constructions." },
      { property: "og:title", content: "About Aditya Constructions" },
      { property: "og:description", content: "25 years of trusted craftsmanship in Hyderabad." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      <section className="bg-navy py-24 text-navy-foreground">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <p className="text-xs uppercase tracking-widest text-gold">Our story</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">A quarter century of building trust.</h1>
          <p className="mt-6 max-w-3xl text-lg text-navy-foreground/80">
            Founded in 1998 in Hyderabad, Aditya Constructions began as a small civil firm with a
            stubborn belief: that every building should outlast the people who order it. Today
            we're a 400-strong, vertically integrated team delivering construction, interiors,
            HVAC, solar and real estate across South India.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-24 md:grid-cols-3 lg:px-8">
        {[
          { y: "1998", t: "Founded", d: "First civil contract in Jubilee Hills." },
          { y: "2008", t: "Diversified", d: "Launched interiors & HVAC verticals." },
          { y: "2016", t: "Solar", d: "Commissioned first 5 MW solar plant." },
          { y: "2020", t: "Real Estate", d: "Launched Aditya Heights — sold out in 90 days." },
          { y: "2024", t: "Digital", d: "Live project tracking for every client." },
          { y: "Today", t: "300+ Projects", d: "5M sq.ft built, 98% on-time delivery." },
        ].map((m) => (
          <div key={m.y} className="border-l-2 border-gold pl-6">
            <div className="font-display text-3xl text-navy">{m.y}</div>
            <h3 className="mt-2 font-display text-lg">{m.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{m.d}</p>
          </div>
        ))}
      </section>
      <section className="bg-muted/40 py-24">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <h2 className="font-display text-4xl">The values we build by</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { t: "Craft", d: "Every joint, finish and weld is owned by a named engineer." },
              { t: "Candour", d: "No hidden cost, no surprise delay. You see what we see." },
              { t: "Custodianship", d: "We build for the second owner, not just the first." },
            ].map((v) => (
              <div key={v.t} className="rounded-lg border border-border bg-card p-8">
                <h3 className="font-display text-xl text-navy">{v.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
