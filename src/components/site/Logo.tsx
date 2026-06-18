import logo from "@/assets/ac-logo-new.png";

export function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="Aditya Constructions"
      className={className}
      decoding="async"
      loading="eager"
    />
  );
}
