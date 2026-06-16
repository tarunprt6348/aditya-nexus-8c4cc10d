import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetail } from "@/components/site/ServiceDetail";
import img from "@/assets/service-construction.jpg";

export const Route = createFileRoute("/_marketing/services/construction")({
  head: () => ({
    meta: [
      { title: "Construction — Aditya Constructions" },
      { name: "description", content: "Residential, commercial, industrial and institutional construction — from small-scale work to turnkey developments." },
      { property: "og:title", content: "Construction — Aditya Constructions" },
      { property: "og:description", content: "Engineering-led construction with strict adherence to quality and timelines." },
      { property: "og:image", content: img },
    ],
  }),
  component: () => (
    <ServiceDetail
      eyebrow="Service · Construction"
      title="From minor works to turnkey developments."
      image={img}
      intro="We undertake all types of construction work, from small-scale projects to large turnkey developments — with strict adherence to engineering standards, quality materials and efficient project management."
      features={[
        "Residential Construction (Villas, Independent Houses, Apartments)",
        "Commercial Buildings (Offices, Showrooms, Complexes)",
        "Industrial Construction",
        "Institutional Buildings",
        "Renovation & Remodeling",
        "RCC & Structural Works",
        "Civil Finishing Works",
        "Waterproofing & Structural Repair Works",
        "Turnkey Construction Projects",
      ]}
      process={[
        { t: "Discovery", d: "Site survey and brief alignment." },
        { t: "Design", d: "Architecture, structure and MEP coordination." },
        { t: "Build", d: "Phase-gated execution with weekly client reviews." },
        { t: "Handover", d: "Snag-free handover with post-project support." },
      ]}
    />
  ),
});
