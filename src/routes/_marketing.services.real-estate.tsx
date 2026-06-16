import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetail } from "@/components/site/ServiceDetail";
import img from "@/assets/service-realestate.jpg";

export const Route = createFileRoute("/_marketing/services/real-estate")({
  head: () => ({
    meta: [
      { title: "Real Estate — Aditya Constructions" },
      { name: "description", content: "Professional assistance in sale, purchase and rental of residential and commercial properties." },
      { property: "og:image", content: img },
    ],
  }),
  component: () => (
    <ServiceDetail
      eyebrow="Service · Real Estate"
      title="Property solutions with transparency and reliability."
      image={img}
      intro="We provide professional assistance in the sale, purchase and rental of properties — backed by advisory and investment guidance to help you make confident decisions."
      features={[
        "Residential Property Sales & Purchases",
        "Commercial Property Transactions",
        "Property Rentals & Leasing",
        "Real Estate Advisory",
        "Investment Guidance",
      ]}
      process={[
        { t: "Brief", d: "Understand your goals, budget and location." },
        { t: "Shortlist", d: "Curated options matched to your requirements." },
        { t: "Transact", d: "Documentation and registration support." },
        { t: "Support", d: "Post-transaction handover and follow-up." },
      ]}
    />
  ),
});
