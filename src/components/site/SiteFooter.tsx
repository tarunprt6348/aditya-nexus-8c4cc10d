import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-sm bg-gold text-navy font-display text-lg">A</span>
            <span className="font-display text-lg">Aditya Constructions</span>
          </div>
          <p className="text-sm text-navy-foreground/70">
            Building landmark spaces across Hyderabad since 1998 — construction, interiors, HVAC,
            solar, and real estate under one trusted name.
          </p>
        </div>
        <div>
          <h4 className="mb-4 font-display text-sm uppercase tracking-widest text-gold">Services</h4>
          <ul className="space-y-2 text-sm text-navy-foreground/80">
            <li><Link to="/services/construction">Construction</Link></li>
            <li><Link to="/services/interiors">Interiors</Link></li>
            <li><Link to="/services/hvac">HVAC</Link></li>
            <li><Link to="/services/solar">Solar</Link></li>
            <li><Link to="/services/real-estate">Real Estate</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-display text-sm uppercase tracking-widest text-gold">Company</h4>
          <ul className="space-y-2 text-sm text-navy-foreground/80">
            <li><Link to="/about">About</Link></li>
            <li><Link to="/projects">Projects</Link></li>
            <li><Link to="/careers">Careers</Link></li>
            <li><Link to="/blog">Insights</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-display text-sm uppercase tracking-widest text-gold">Get in touch</h4>
          <ul className="space-y-3 text-sm text-navy-foreground/80">
            <li className="flex gap-3"><MapPin className="h-4 w-4 shrink-0 text-gold" /> Banjara Hills, Hyderabad, Telangana 500034</li>
            <li className="flex gap-3"><Phone className="h-4 w-4 shrink-0 text-gold" /> +91 90000 00000</li>
            <li className="flex gap-3"><Mail className="h-4 w-4 shrink-0 text-gold" /> hello@adityaconstructions.in</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-navy-foreground/60 lg:flex-row lg:px-8">
          <p>© {new Date().getFullYear()} Aditya Constructions. All rights reserved.</p>
          <p>RERA · ISO 9001:2015 · NABL Certified</p>
        </div>
      </div>
    </footer>
  );
}
