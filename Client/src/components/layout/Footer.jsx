import React from "react";
import { Link } from "react-router-dom";
import { PawPrint, Mail, Phone, ShoppingCart, Heart, Plus, Tag, Search } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-100 pt-20 pb-10 px-[5%]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
        {/* Brand Column */}
        <div className="flex flex-col gap-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl">
              <PawPrint size={24} className="text-white" />
            </div>
            <span className="font-heading font-black text-2xl tracking-tighter text-slate-900">
              PetCenter
            </span>
          </Link>
          <p className="text-slate-500 leading-relaxed font-medium">
            Building a better world for every pet. The most trusted platform for pet lovers, 
            breeders, and habitat designers.
          </p>
          <div className="flex gap-4">
            {[Search, Mail, Heart].map((Icon, i) => (
              <a key={i} href="#" className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-black text-slate-900 mb-8 uppercase tracking-widest text-xs">Platform</h4>
          <ul className="flex flex-col gap-4">
            {[
              { name: "Marketplace", path: "/marketplace" },
              { name: "Store", path: "/products" },
              { name: "Ecosystems", path: "/ecosystem" },
              { name: "Donations", path: "/campaigns" },
              { name: "About Us", path: "/about" }
            ].map((link) => (
              <li key={link.name}>
                <Link to={link.path} className="text-slate-500 hover:text-primary font-bold transition-colors">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-black text-slate-900 mb-8 uppercase tracking-widest text-xs">Support</h4>
          <ul className="flex flex-col gap-4">
            {["Help Center", "Safety Guidelines", "Terms of Service", "Privacy Policy", "Contact Support"].map((link) => (
              <li key={link}>
                <Link to="#" className="text-slate-500 hover:text-primary font-bold transition-colors">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-black text-slate-900 mb-8 uppercase tracking-widest text-xs">Get in Touch</h4>
          <ul className="flex flex-col gap-6">
            <li className="flex items-start gap-4">
              <div className="p-2 bg-primary/5 text-primary rounded-lg">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                <p className="font-bold text-slate-900">hello@petcenter.com</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="p-2 bg-primary/5 text-primary rounded-lg">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                <p className="font-bold text-slate-900">+1 (555) 000-0000</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-slate-400 font-bold text-sm">
          © 2026 PetCenter. All rights reserved.
        </p>
        <div className="flex gap-8">
          <Link to="#" className="text-slate-400 hover:text-slate-600 text-sm font-bold transition-colors">Privacy</Link>
          <Link to="#" className="text-slate-400 hover:text-slate-600 text-sm font-bold transition-colors">Terms</Link>
          <Link to="#" className="text-slate-400 hover:text-slate-600 text-sm font-bold transition-colors">Cookies</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
