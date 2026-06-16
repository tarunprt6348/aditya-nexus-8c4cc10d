import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetail } from "@/components/site/ServiceDetail";
import img from "@/assets/service-hvac.jpg";

export const Route = createFileRoute("/_marketing/services/hvac")({
  head: () => ({
    meta: [
      { title: "HVAC — Aditya Constructions" },
      { name: "description", content: "Heating, ventilation and air conditioning — design, installation and maintenance for comfortable, energy-efficient spaces." },
      { property: "og:image", content: img },
    ],
  }),
  component: () => (
    <ServiceDetail
      eyebrow="Service · HVAC"
      title="Comfortable, energy-efficient environments."
      image={img}
      intro="We provide Heating, Ventilation and Air Conditioning (HVAC) services for residential, commercial and industrial spaces — engineered for performance and serviced for the life of the building."
      features={[
        "HVAC System Design & Installation",
        "VRV / VRF Systems",
        "Centralized Air Conditioning Systems",
        "Ducting & Ventilation Works",
        "HVAC Maintenance & Servicing",
      ]}
      process={[
        { t: "Audit", d: "Heat-load and space audit." },
        { t: "Design", d: "Equipment selection, ducting and zoning." },
        { t: "Install", d: "Phased install with minimal disruption." },
        { t: "Service", d: "Commissioning and ongoing maintenance." },
      ]}
    />
  ),
});
