import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_marketing/about")({
  head: () => ({
    meta: [
      { title: "About — Aditya Constructions" },
      { name: "description", content: "Aditya Constructions delivers construction, interiors, real estate, HVAC and solar — everything under one roof, from Greater Noida." },
      { property: "og:title", content: "About Aditya Constructions" },
      { property: "og:description", content: "Engineering excellence, transparency and on-time delivery — under one roof." },
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
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Everything under one roof.</h1>
          <p className="mt-6 max-w-3xl text-lg text-navy-foreground/80">
            Aditya Constructions is a dynamic and professionally managed firm providing
            comprehensive solutions in construction, interior works, real estate services, HVAC
            systems and solar energy. We cater to residential, commercial, industrial and
            institutional projects of all scales, with a commitment to quality, precision and
            timely delivery.
          </p>
          <p className="mt-4 max-w-3xl text-navy-foreground/75">
            Driven by engineering expertise and a client-focused approach, we offer end-to-end
            services from planning and execution to finishing and post-project support — built on
            trust, transparency and long-term relationships.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-24 md:grid-cols-2 lg:px-8">
        <div className="border-l-2 border-gold pl-6">
          <p className="text-xs uppercase tracking-widest text-gold">Our Vision</p>
          <h2 className="mt-2 font-display text-3xl">A trusted name in infrastructure.</h2>
          <p className="mt-4 text-muted-foreground">
            To become a trusted and recognized name in the construction and infrastructure sector
            by delivering innovative, sustainable and high-quality projects.
          </p>
        </div>
        <div className="border-l-2 border-gold pl-6">
          <p className="text-xs uppercase tracking-widest text-gold">Our Mission</p>
          <h2 className="mt-2 font-display text-3xl">Integrated, modern, client-first.</h2>
          <p className="mt-4 text-muted-foreground">
            To provide integrated construction and infrastructure solutions that combine
            engineering excellence, modern technology and customer-centric service.
          </p>
        </div>
      </section>

      <section className="bg-muted/40 py-24">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <p className="text-xs uppercase tracking-widest text-gold">Our experience</p>
          <h2 className="mt-3 font-display text-4xl">Where we have worked</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[
              { t: "Building Construction Projects", d: "Residential, commercial and institutional builds executed end-to-end." },
              { t: "Society Internal CC Roads", d: "Concrete road works for residential societies and townships." },
              { t: "Landscaping & Horticulture", d: "Green-space planning, hardscape and softscape execution." },
              { t: "Interior Design & Execution", d: "Modular kitchens, wardrobes, false ceilings, woodwork and finishes." },
            ].map((v) => (
              <div key={v.t} className="rounded-lg border border-border bg-card p-8">
                <h3 className="font-display text-xl text-navy">{v.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <h2 className="font-display text-4xl">Why choose us</h2>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            At Aditya Constructions we bring together industry expertise and efficient labour
            management to deliver civil construction services that stand apart in quality and
            execution. Our approach is driven by precision, planning and a commitment to
            excellence at every stage.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { t: "On-time delivery", d: "Projects executed to schedule with transparent timelines." },
              { t: "Total transparency", d: "Open communication, costed proposals, no surprise variations." },
              { t: "Skilled workmanship", d: "In-house teams and strong on-site management for every detail." },
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
