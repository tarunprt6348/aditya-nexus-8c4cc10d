import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_marketing/blog/")({
  head: () => ({
    meta: [
      { title: "Insights — Aditya Constructions" },
      { name: "description", content: "Notes on construction, design, real estate and sustainability from the Aditya team." },
    ],
  }),
  component: BlogIndex,
});

const posts = [
  {
    slug: "why-every-rooftop-should-go-solar-by-2030",
    title: "Why every rooftop should go solar by 2030",
    category: "Sustainability",
    readTime: "6 min read",
    excerpt: "How net-metering, falling panel costs and rising tariffs change the math.",
  },
  {
    slug: "the-hidden-cost-of-cheap-interiors",
    title: "The hidden cost of cheap interiors",
    category: "Design",
    readTime: "4 min read",
    excerpt: "What a 5-year warranty actually covers — and why most don't.",
  },
  {
    slug: "vrf-vs-chiller-buyers-framework",
    title: "VRF vs Chiller: a buyer's framework",
    category: "HVAC",
    readTime: "8 min read",
    excerpt: "A practical decision tree for offices between 5,000–50,000 sqft.",
  },
  {
    slug: "rera-for-first-time-buyers",
    title: "RERA for first-time buyers",
    category: "Real Estate",
    readTime: "5 min read",
    excerpt: "Six checks that prevent 90% of regrets.",
  },
];

function BlogIndex() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
      <p className="text-xs uppercase tracking-widest text-gold">Insights</p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl md:text-6xl">Notes from the field.</h1>
      <div className="mt-16 grid gap-8 md:grid-cols-2">
        {posts.map((p) => (
          <Link
            key={p.slug}
            to="/blog/$slug"
            params={{ slug: p.slug }}
            className="group block rounded-lg border border-border bg-card p-8 transition-all hover:shadow-[var(--shadow-elegant)]"
          >
            <p className="text-xs uppercase tracking-widest text-gold">{p.category} · {p.readTime}</p>
            <h2 className="mt-3 font-display text-2xl group-hover:text-navy">{p.title}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{p.excerpt}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-navy group-hover:text-gold transition-colors">
              Read more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-12 text-center text-sm text-muted-foreground">More insights coming soon.</p>
    </section>
  );
}
