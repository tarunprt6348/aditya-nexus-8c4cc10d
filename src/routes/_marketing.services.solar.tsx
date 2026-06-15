import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetail } from "@/components/site/ServiceDetail";
import img from "@/assets/service-solar.jpg";

export const Route = createFileRoute("/_marketing/services/solar")({
  head: () => ({
    meta: [
      { title: "Solar — Aditya Constructions" },
      { name: "description", content: "Grid-tied rooftop and utility-scale solar — design, install and 25-year O&M." },
      { property: "og:image", content: img },
    ],
  }),
  component: () => (
    <ServiceDetail
      eyebrow="Service · Solar"
      title="Solar that pays back, year after year."
      image={img}
      intro="MNRE-empanelled EPC for residential, commercial and utility-scale solar. Tier-1 modules, German inverters, and a 25-year performance guarantee monitored from our Hyderabad operations centre."
      features={[
        "Rooftop solar — 3 kW to 1 MW",
        "Utility-scale ground-mount up to 50 MW",
        "Net-metering and subsidy paperwork handled",
        "Tier-1 modules, Tier-1 inverters",
        "25-year remote monitoring & O&M",
        "Battery storage and hybrid systems",
        "Carbon offset reporting",
      ]}
      process={[
        { t: "Assess", d: "Shadow analysis and consumption audit." },
        { t: "Engineer", d: "Single-line diagram and structural design." },
        { t: "Install", d: "Commissioned in 2–6 weeks." },
        { t: "Monitor", d: "Live dashboard and proactive maintenance." },
      ]}
    />
  ),
});
