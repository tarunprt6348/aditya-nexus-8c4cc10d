import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_marketing/blog/$slug")({
  head: ({ params }) => {
    const post = POSTS.find((p) => p.slug === params.slug);
    return {
      meta: [
        { title: post ? `${post.title} — Aditya Constructions Insights` : "Insight — Aditya Constructions" },
        { name: "description", content: post?.excerpt ?? "" },
      ],
    };
  },
  loader: ({ params }) => {
    const post = POSTS.find((p) => p.slug === params.slug);
    if (!post) throw notFound();
    return post;
  },
  component: PostPage,
});

interface Post {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  excerpt: string;
  content: string[];
  tags: string[];
  relatedSlugs: string[];
}

const POSTS: Post[] = [
  {
    slug: "why-every-rooftop-should-go-solar-by-2030",
    title: "Why every rooftop should go solar by 2030",
    category: "Sustainability",
    readTime: "6 min read",
    excerpt: "How net-metering, falling panel costs and rising tariffs change the math.",
    tags: ["Solar", "Sustainability", "Energy", "Net Metering"],
    relatedSlugs: ["vrf-vs-chiller-buyers-framework"],
    content: [
      "India's electricity tariffs have risen by an average of 8–10% per year over the last decade. For a commercial establishment consuming 10,000 units a month, that compounding effect is now the single largest controllable operating cost. Solar is no longer an environmental statement — it is a financial decision.",
      "## The net-metering shift",
      "Net-metering regulations, now active across all major states, allow rooftop solar owners to export excess daytime generation back to the grid. Your metre runs backwards when the sun shines and forward at night — you pay only the net. For businesses operating primarily during daylight hours (offices, factories, showrooms), this can eliminate the electricity bill almost entirely.",
      "## Falling panel costs",
      "The cost of a solar module has dropped by over 90% since 2010. A system that cost ₹12–15 crore per MW a decade ago now installs at ₹3.5–4.5 crore per MW, including inverters, mounting, wiring and monitoring. Typical payback periods for commercial rooftops in Delhi NCR are now 3.5–5 years — on a system warranted for 25 years.",
      "## What the numbers look like",
      "A 50 kWp rooftop system on a commercial building in Greater Noida generates approximately 65,000–70,000 units per year. At ₹8/unit (commercial tariff), that represents ₹5.2–5.6 lakh in annual savings. Capital cost: roughly ₹18–22 lakh. Payback: under 4 years.",
      "## The 2030 deadline",
      "India's RE targets require 500 GW of renewable capacity by 2030. State DISCOMs are increasingly incentivising rooftop solar through subsidies (up to 30% for residential systems) and faster net-metering approvals. Those who install before 2027 lock in today's tariff rates and subsidy structures — both are likely to change as grid penetration rises.",
      "## How Aditya Constructions can help",
      "Our solar division handles end-to-end EPC: site assessment, shadow analysis, structural loading, DISCOM liaison, installation and 10-year O&M. We have commissioned systems from 5 kWp residential to 1 MWp commercial. If you are considering solar, the right time to act is before your next electricity bill.",
    ],
  },
  {
    slug: "the-hidden-cost-of-cheap-interiors",
    title: "The hidden cost of cheap interiors",
    category: "Design",
    readTime: "4 min read",
    excerpt: "What a 5-year warranty actually covers — and why most don't.",
    tags: ["Interiors", "Quality", "Warranty", "Design"],
    relatedSlugs: ["why-every-rooftop-should-go-solar-by-2030"],
    content: [
      "The interior fit-out market in India is full of attractive low-cost quotes. A modular kitchen for ₹3 lakh sounds reasonable — until it starts delaminating in year two. Understanding what drives fit-out pricing, and what is omitted from cheap quotes, is the most valuable conversation you can have before signing a contract.",
      "## What a fit-out quote actually contains",
      "A typical interior quote covers: materials (board type, veneer/membrane/laminate finish, hardware brand), fabrication (factory vs site-made), installation (anchoring method, wall prep) and finishes (edge banding, handles, soft-close hinges). Each of these has a 5× cost range between the cheapest and mid-market option. Most low-cost quotes use 8 mm commercial MDF, site-fabricated carcasses and generic hinges — none of which is disclosed in the line item.",
      "## The 5-year warranty question",
      "Ask any vendor for their warranty document before signing. A genuine warranty on interior woodwork should cover: structural integrity of the carcass, finish adhesion (no peeling, bubbling or delamination), hardware operation (hinges, channels, locks) and water damage to the substrate. Most cheap-market vendors offer a verbal 'one year service warranty' that covers nothing beyond the first monsoon.",
      "## The real cost of redoing",
      "A kitchen that fails in year three costs you the replacement material, fresh installation labour, repainting the surrounding walls and two weeks of disruption. The saving from the cheap quote is typically consumed twice over. Our recommendation: spend 20% more upfront on 18 mm BWR-grade plywood carcasses with HPDL or membrane finish, Hettich or Grass hardware, and a written 5-year structural warranty.",
      "## What Aditya's warranty covers",
      "All Aditya Constructions interior projects come with a written 5-year warranty on structural integrity and finish adhesion, and a 2-year hardware replacement warranty. Our designs use factory-fabricated carcasses on calibrated machinery, site-inspected before installation. The difference in cost versus the cheapest alternative is typically 15–25% — the difference in longevity is a decade.",
    ],
  },
  {
    slug: "vrf-vs-chiller-buyers-framework",
    title: "VRF vs Chiller: a buyer's framework",
    category: "HVAC",
    readTime: "8 min read",
    excerpt: "A practical decision tree for offices between 5,000–50,000 sqft.",
    tags: ["HVAC", "VRF", "Chiller", "Commercial", "MEP"],
    relatedSlugs: ["rera-for-first-time-buyers"],
    content: [
      "If you are fitting out or retrofitting an office between 5,000 and 50,000 square feet in India, you will face one central HVAC decision: Variable Refrigerant Flow (VRF/VRV) or a water-cooled chiller plant. Both work. The right choice depends on your building geometry, occupancy pattern, capital budget and long-term operating priorities.",
      "## What VRF is good at",
      "VRF systems use refrigerant directly to indoor units, eliminating the chiller, cooling tower, AHU and chilled-water pipework. They are modular (you can expand), individually zoned (each room has its own thermostat), easier to install in existing buildings (no major civil work for risers) and very efficient at part loads — which describes 80% of actual office operating conditions.",
      "For offices under 15,000 sqft with irregular floor plates, VRF is almost always the right answer. Capital cost is lower, installation time is shorter and ongoing maintenance is simpler.",
      "## When chillers make sense",
      "Chiller plants become competitive above 30 TR (roughly 10,000–12,000 sqft of well-insulated office space in Delhi NCR). At large tonnages, the COP advantage of inverter-driven centrifugal or screw chillers at full load exceeds VRF's part-load advantage. Water-cooled chillers also have lower running costs per TR in sustained high-load environments (data centres, hospitals, large call centres).",
      "## The decision matrix",
      "| Factor | Favour VRF | Favour Chiller |",
      "| Floor area | < 20,000 sqft | > 30,000 sqft |",
      "| Occupancy | Variable, zoned | Dense, uniform |",
      "| Building age | Retrofit / leased | New construction |",
      "| Capital budget | Lower CAPEX priority | Willing to invest |",
      "| Operating hours | Part-time (< 12 hrs/day) | 24/7 |",
      "## The 15,000–30,000 sqft grey zone",
      "In this range, both systems can be justified. Our recommendation: model your actual occupancy profile against the building's heat load, run a 10-year NPV analysis including maintenance costs, and let the numbers decide. We do this modelling as part of our pre-design consultancy — at no cost for projects we are likely to execute.",
      "## How Aditya approaches HVAC design",
      "Our MEP team handles design, supply, installation and commissioning of both VRF and chiller systems. We are brand-agnostic (Daikin, Mitsubishi, Carrier, Trane) and will recommend based on your specific project requirements. AMC packages are available from handover.",
    ],
  },
  {
    slug: "rera-for-first-time-buyers",
    title: "RERA for first-time buyers",
    category: "Real Estate",
    readTime: "5 min read",
    excerpt: "Six checks that prevent 90% of regrets.",
    tags: ["Real Estate", "RERA", "Legal", "Homebuying"],
    relatedSlugs: ["the-hidden-cost-of-cheap-interiors"],
    content: [
      "RERA (Real Estate Regulation and Development Act, 2016) transformed India's property market by making builders accountable in ways they never were before. Yet most first-time buyers in Delhi NCR still walk into a developer's office having done no RERA verification. Six checks — each taking under ten minutes — will protect you from 90% of documented cases of buyer regret.",
      "## Check 1: Verify RERA registration",
      "Every project sold in Uttar Pradesh must be registered on rera.up.gov.in before the developer can advertise or accept bookings. Search for the project by name or RERA ID. Confirm the registration is active (not lapsed or cancelled) and that the registered area, configuration and completion date match what you are being shown.",
      "## Check 2: Read the approved layout",
      "The RERA portal shows the approved site plan and floor plans. Compare the carpet area shown on RERA with what the developer quotes as 'super area'. In UP, RERA mandates that sale agreements use carpet area pricing — if a developer quotes only super area, ask for the carpet area breakdown.",
      "## Check 3: Check encumbrances on the land",
      "Use the UP Revenue Records portal (upbhulekh.gov.in) to verify that the land is free from mortgages or litigation. Ask the developer for the title clearance report from their legal counsel. A reputable developer will provide this without hesitation.",
      "## Check 4: Track construction progress",
      "RERA registrations require quarterly progress updates. Check when the last update was filed and whether the construction milestone matches physical site progress. Significant delays or non-filing of updates are early warning signs.",
      "## Check 5: Verify the builder's RERA history",
      "Search the developer's name in the RERA portal to see all registered projects. How many are completed on time? How many have complaints filed? A developer with multiple complaints or lapsed registrations deserves harder due diligence.",
      "## Check 6: Read the sale agreement before paying",
      "Under RERA, the builder must share the draft sale agreement before you pay more than 10% of the unit value. Read the penalty clause for delayed possession (builders often try to dilute this), the maintenance deposit terms, the definition of force majeure, and the dispute resolution mechanism.",
      "## How Aditya helps buyers",
      "Our real estate advisory team assists buyers with RERA verification, title due diligence and independent inspection at handover — for both Aditya projects and third-party developments. If you are evaluating a purchase, talk to us before signing.",
    ],
  },
];

function PostPage() {
  const post = Route.useLoaderData() as Post | undefined;
  if (!post) return null;

  const related = POSTS.filter((p) => post.relatedSlugs.includes(p.slug));

  return (
    <>
      <section className="bg-navy py-20 text-navy-foreground">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-navy-foreground/60 hover:text-gold transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Insights
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-gold/20 px-3 py-1 text-xs uppercase tracking-widest text-gold">
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-navy-foreground/50">
              <Clock className="h-3.5 w-3.5" /> {post.readTime}
            </span>
          </div>
          <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl lg:text-6xl">
            {post.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-navy-foreground/75">{post.excerpt}</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
        <div className="prose prose-lg max-w-none">
          {post.content.map((block: string, i: number) => {
            if (block.startsWith("## ")) {
              return (
                <h2 key={i} className="mt-10 mb-4 font-display text-2xl text-navy">
                  {block.replace("## ", "")}
                </h2>
              );
            }
            if (block.startsWith("| ")) {
              return null;
            }
            return (
              <p key={i} className="mb-5 leading-relaxed text-muted-foreground">
                {block}
              </p>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {post.tags.map((tag: string) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
            >
              <Tag className="h-3 w-3" /> {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
          <p className="text-xs uppercase tracking-widest text-gold">Ready to move forward?</p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl">
            Have a project in mind?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Our team responds within one business day with an estimated timeline and budget range.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-navy text-navy-foreground hover:bg-navy/90">
              <Link to="/quote">Request a Quote <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
          <h2 className="font-display text-2xl">Related insights</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                to="/blog/$slug"
                params={{ slug: r.slug }}
                className="group rounded-lg border border-border bg-card p-6 transition-all hover:shadow-[var(--shadow-elegant)]"
              >
                <span className="text-xs uppercase tracking-widest text-gold">{r.category} · {r.readTime}</span>
                <h3 className="mt-2 font-display text-lg group-hover:text-navy">{r.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{r.excerpt}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-navy group-hover:text-gold">
                  Read more <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
