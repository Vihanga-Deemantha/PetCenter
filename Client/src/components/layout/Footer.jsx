import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";
import logo from "../../assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-dark text-light">
      <div className="max-w-7xl mx-auto px-7 pt-19 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Brand Column */}
        <div>
          <Link to="/" className="flex items-center gap-2.5 mb-4.5">
            <img src={logo} alt="PetCenter" className="w-8.5 h-8.5 object-contain" />
            <span className="font-heading text-xl text-light">PetCenter</span>
          </Link>
          <p className="text-[#a9a89f] leading-relaxed text-sm max-w-70">
            Pets, supplies and habitats, held to one standard of care.
          </p>
        </div>

        {/* Platform */}
        <div>
          <h4 className="text-accent mb-4 uppercase tracking-widest text-[11px] font-medium">Platform</h4>
          <ul className="flex flex-col gap-2.5 text-sm">
            {[
              { name: "Marketplace", path: "/marketplace" },
              { name: "Store", path: "/products" },
              { name: "Ecosystems", path: "/ecosystem" },
              { name: "Donations", path: "/campaigns" },
              { name: "About Us", path: "/about" },
            ].map((link) => (
              <li key={link.name}>
                <Link to={link.path} className="text-[#d6d3ca] hover:text-primary transition-colors">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-accent mb-4 uppercase tracking-widest text-[11px] font-medium">Support</h4>
          <ul className="flex flex-col gap-2.5 text-sm">
            {[
              { name: "Help Center", path: "/help" },
              { name: "Safety Guidelines", path: "/safety" },
              { name: "Terms of Service", path: "/terms" },
              { name: "Privacy Policy", path: "/privacy" },
              { name: "Contact Support", path: "/contact" },
            ].map((link) => (
              <li key={link.name}>
                <Link to={link.path} className="text-[#d6d3ca] hover:text-primary transition-colors">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-accent mb-4 uppercase tracking-widest text-[11px] font-medium">Get in touch</h4>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li className="flex items-center gap-2 text-[#d6d3ca]">
              <Mail size={14} className="text-accent" />
              <a href="mailto:hello@petcenter.com" className="hover:text-primary transition-colors">hello@petcenter.com</a>
            </li>
            <li className="flex items-center gap-2 text-[#d6d3ca]">
              <Phone size={14} className="text-accent" />
              <a href="tel:+15550000000" className="hover:text-primary transition-colors">+1 (555) 000-0000</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-7 pt-5.5 pb-10 border-t border-[#3a3a34] flex flex-col md:flex-row justify-between gap-5 text-[13px] text-[#8a897f]">
        <span>© 2026 PetCenter. All rights reserved.</span>
        <span>Made for calmer pet care</span>
      </div>
    </footer>
  );
};

export default Footer;
