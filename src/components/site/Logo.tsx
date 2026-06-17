import logo from "@/assets/ac-logo.png.asset.json";

export function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <img
      src={logo.url}
      alt="Aditya Constructions logo"
      className={className}
      width={512}
      height={620}
      decoding="async"
      loading="eager"
    />
  );
}
