import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetail } from "@/components/site/ServiceDetail";
import img from "@/assets/service-interiors.jpg";

export const Route = createFileRoute("/_marketing/services/interiors")({
  head: () => ({
    meta: [
      { title: "Interiors — Aditya Constructions" },
      { name: "description", content: "Modular kitchens, wardrobes, false ceilings, woodwork and turnkey interior fit-outs." },
      { property: "og:image", content: img },
    ],
  }),
  component: () => (
    <ServiceDetail
      eyebrow="Service · Interiors"
      title="Functional, aesthetic, modern interiors."
      image={img}
      intro="Our interior services transform spaces into functional, aesthetic and modern environments — from modular kitchens and wardrobes to full turnkey interior projects."
      features={[
        "Modular Kitchens",
        "Wardrobes & Storage Solutions",
        "False Ceiling & Lighting Design",
        "Flooring & Wall Finishes",
        "Office & Commercial Interiors",
        "Customized Furniture & Woodwork",
        "Electrical & Lighting Installations",
        "Interior Renovation & Refurbishment",
        "Turnkey Interior Projects",
      ]}
      process={[
        { t: "Brief", d: "Lifestyle and usage workshop." },
        { t: "Concept", d: "Mood boards and material samples." },
        { t: "Fabricate", d: "Joinery and site work in parallel." },
        { t: "Style", d: "Final styling and snag walk-through." },
      ]}
    />
  ),
});
