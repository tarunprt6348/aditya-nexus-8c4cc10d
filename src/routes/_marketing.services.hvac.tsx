import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetail } from "@/components/site/ServiceDetail";
import img from "@/assets/service-hvac.jpg";

export const Route = createFileRoute("/_marketing/services/hvac")({
  head: () => ({
    meta: [
      { title: "HVAC — Aditya Constructions" },
      { name: "description", content: "VRF, chillers and central HVAC systems — design, install and maintain across Hyderabad." },
      { property: "og:image", content: img },
    ],
  }),
  component: () => (
    <ServiceDetail
      eyebrow="Service · HVAC"
      title="Climate engineering, done quietly."
      image={img}
      intro="Our MEP division designs and commissions HVAC systems for homes, offices, hospitals and industrial plants — energy-modelled, ASHRAE-compliant, and serviced for the life of the building."
      features={[
        "VRF / VRV systems (Daikin, Mitsubishi, LG)",
        "Centralised chiller plants",
        "Ducted, cassette and decorative units",
        "Energy modelling and load calculation",
        "Indoor air quality and HEPA filtration",
        "BMS integration",
        "AMC and 24/7 service contracts",
      ]}
      process={[
        { t: "Audit", d: "Heat-load and space audit with energy modelling." },
        { t: "Design", d: "Equipment selection, ducting and zoning." },
        { t: "Install", d: "Phased install with minimal site disruption." },
        { t: "Service", d: "Commissioning + ongoing AMC." },
      ]}
    />
  ),
});
