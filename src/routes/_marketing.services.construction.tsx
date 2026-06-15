import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetail } from "@/components/site/ServiceDetail";
import img from "@/assets/service-construction.jpg";

export const Route = createFileRoute("/_marketing/services/construction")({
  head: () => ({
    meta: [
      { title: "Construction — Aditya Constructions" },
      { name: "description", content: "Residential, commercial and industrial construction in Hyderabad. Design-build, civil & structural engineering, MEP, finishing." },
      { property: "og:title", content: "Construction — Aditya Constructions" },
      { property: "og:description", content: "Design-build construction for residential, commercial and industrial projects." },
      { property: "og:image", content: img },
    ],
  }),
  component: () => (
    <ServiceDetail
      eyebrow="Service · Construction"
      title="Construction that outlasts the city."
      image={img}
      intro="From bespoke villas to 30-storey towers and high-spec industrial plants, our civil and structural teams deliver projects that pass every audit and outlive every trend."
      features={[
        "Residential — villas, apartments, gated communities",
        "Commercial — offices, retail, hospitality",
        "Industrial — warehouses, factories, data centers",
        "Civil & structural engineering in-house",
        "MEP coordination and finishing",
        "BIM-based design and clash detection",
        "Quality control with NABL-certified materials",
      ]}
      process={[
        { t: "Discovery", d: "Site survey, soil testing and brief alignment." },
        { t: "Design", d: "Architecture, structure, MEP and BIM coordination." },
        { t: "Build", d: "Phase-gated execution with weekly client reviews." },
        { t: "Handover", d: "Snag-free handover with 10-year structural warranty." },
      ]}
    />
  ),
});
