import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_marketing/blog")({
  head: () => ({
    meta: [
      { title: "Insights — Aditya Constructions" },
      { name: "description", content: "Notes on construction, design, real estate and sustainability from the Aditya team." },
    ],
  }),
  component: Blog,
});

const posts = [
  { t: "Why every Hyderabad rooftop should be solar by 2030", c: "Sustainability · 6 min read", d: "How net-metering, falling panel costs and rising tariffs change the math." },
  { t: "The hidden cost of cheap interiors", c: "Design · 4 min read", d: "What a 5-year warranty actually covers — and why most don't." },
  { t: "VRF vs Chiller: a buyer's framework", c: "HVAC · 8 min read", d: "A practical decision tree for offices between 5,000–50,000 sqft." },
  { t: "RERA for first-time buyers", c: "Real Estate · 5 min read", d: "Six checks that prevent 90% of regrets." },
];

function Blog() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
      <p className="text-xs uppercase tracking-widest text-gold">Insights</p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl md:text-6xl">Notes from the field.</h1>
      <div className="mt-16 grid gap-8 md:grid-cols-2">
        {posts.map((p) => (
          <article key={p.t} className="group cursor-pointer rounded-lg border border-border bg-card p-8 transition-all hover:shadow-[var(--shadow-elegant)]">
            <p className="text-xs uppercase tracking-widest text-gold">{p.c}</p>
            <h2 className="mt-3 font-display text-2xl group-hover:text-navy">{p.t}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{p.d}</p>
          </article>
        ))}
      </div>
      <p className="mt-12 text-center text-sm text-muted-foreground">More writing coming soon.</p>
    </section>
  );
}
