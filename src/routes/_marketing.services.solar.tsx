import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetail } from "@/components/site/ServiceDetail";
import img from "@/assets/service-solar.jpg";

export const Route = createFileRoute("/_marketing/services/solar")({
  head: () => ({
    meta: [
      { title: "Solar — Aditya Constructions" },
      { name: "description", content: "Rooftop solar systems for residential and commercial buildings — design, install and maintain." },
      { property: "og:image", content: img },
    ],
  }),
  component: () => (
    <ServiceDetail
      eyebrow="Service · Solar"
      title="Sustainable energy, professionally installed."
      image={img}
      intro="Aditya Constructions supports sustainable development through solar energy installations — rooftop systems for homes and businesses, energy-efficiency consultation and ongoing maintenance."
      features={[
        "Rooftop Solar Systems",
        "Solar Panel Installation",
        "Solar Power Solutions for Residential & Commercial Buildings",
        "Energy Efficiency Consultation",
        "Solar System Maintenance",
      ]}
      process={[
        { t: "Assess", d: "Shadow analysis and consumption audit." },
        { t: "Engineer", d: "Single-line diagram and structural design." },
        { t: "Install", d: "Commissioned in 2–6 weeks." },
        { t: "Maintain", d: "Scheduled servicing and performance monitoring." },
      ]}
    />
  ),
});
