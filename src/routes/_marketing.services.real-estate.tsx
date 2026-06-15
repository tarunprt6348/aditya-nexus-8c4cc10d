import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetail } from "@/components/site/ServiceDetail";
import img from "@/assets/service-realestate.jpg";

export const Route = createFileRoute("/_marketing/services/real-estate")({
  head: () => ({
    meta: [
      { title: "Real Estate — Aditya Constructions" },
      { name: "description", content: "Premium plots, villas and apartments across Hyderabad. RERA-registered, ready-to-move and pre-launch." },
      { property: "og:image", content: img },
    ],
  }),
  component: () => (
    <ServiceDetail
      eyebrow="Service · Real Estate"
      title="Addresses worth owning."
      image={img}
      intro="A curated portfolio of plots, villas and apartments in Hyderabad's most sought-after pockets — every property RERA-registered, title-cleared and built by us, end to end."
      features={[
        "HMDA & DTCP approved plots",
        "Premium villas in gated communities",
        "Luxury 3 & 4 BHK apartments",
        "Commercial floors and retail units",
        "RERA registered with clear title",
        "In-house home-loan desk",
        "Property management & resale support",
      ]}
      process={[
        { t: "Discover", d: "Curated shortlist matched to your brief." },
        { t: "Visit", d: "Guided tours with our advisory team." },
        { t: "Transact", d: "Legal, loan and registration handled end-to-end." },
        { t: "Steward", d: "Optional property management post-handover." },
      ]}
    />
  ),
});
