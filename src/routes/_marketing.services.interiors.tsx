import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetail } from "@/components/site/ServiceDetail";
import img from "@/assets/service-interiors.jpg";

export const Route = createFileRoute("/_marketing/services/interiors")({
  head: () => ({
    meta: [
      { title: "Interiors — Aditya Constructions" },
      { name: "description", content: "Bespoke interior design and turnkey fit-outs for homes, offices and hospitality across Hyderabad." },
      { property: "og:image", content: img },
    ],
  }),
  component: () => (
    <ServiceDetail
      eyebrow="Service · Interiors"
      title="Interiors that feel inevitable."
      image={img}
      intro="A 40-person design studio backed by an in-house joinery, soft-furnishing and finishing team. We design, fabricate and install — so every detail lands exactly as drawn."
      features={[
        "Residential interiors — villas & apartments",
        "Workplace design & turnkey office fit-outs",
        "Hospitality — restaurants, hotels, resorts",
        "Custom joinery and modular kitchens",
        "Lighting design and acoustic engineering",
        "Procurement of imported finishes",
        "5-year workmanship warranty",
      ]}
      process={[
        { t: "Brief", d: "Lifestyle and brand workshop with our principal designer." },
        { t: "Concept", d: "Mood boards, 3D walk-throughs and material samples." },
        { t: "Fabricate", d: "In-house joinery; site work runs in parallel." },
        { t: "Style", d: "Soft styling, art curation and snag walk-through." },
      ]}
    />
  ),
});
