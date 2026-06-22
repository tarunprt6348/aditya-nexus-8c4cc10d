import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/site/Logo";

export function SiteFooter() {
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 lg:grid-cols-4 lg:px-8 pt-[42px] pb-[42px] pl-[5px] pr-[5px] ml-[312.333px] mr-[312.333px] mt-[10px] mb-[10px]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Logo className="h-12 w-auto" />
            <span className="font-display text-lg">Aditya Constructions</span>
          </div>
          <p className="text-sm text-navy-foreground/70">
            Everything under one roof — construction, interiors, real estate, HVAC and solar,
            delivered with engineering precision from Greater Noida.
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
            <li className="flex gap-3"><MapPin className="h-4 w-4 shrink-0 text-gold" /> T-22 & 23, Beta Plaza, Beta-1, Greater Noida, U.P. 201310</li>
            <li className="flex gap-3"><Phone className="h-4 w-4 shrink-0 text-gold" /> +91 96509 98403</li>
            <li className="flex gap-3"><Mail className="h-4 w-4 shrink-0 text-gold" /> adityaconstructionsfirm@gmail.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-navy-foreground/60 lg:flex-row lg:px-8">
          <p>© {new Date().getFullYear()} Aditya Constructions. All rights reserved.</p>
          <p>Everything Under One Roof</p>
        </div>
      </div>
    </footer>
  );
}
