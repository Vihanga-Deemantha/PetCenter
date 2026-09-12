import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MessageSquare, LifeBuoy } from "lucide-react";
import { motion as Motion } from "framer-motion";

const Contact = () => (
  <div className="max-w-3xl mx-auto">
    <Motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-14">
      <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[11px] font-black uppercase tracking-widest border border-primary/10">
        Contact Support
      </span>
      <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mt-4 mb-3">
        We're here to help
      </h1>
      <p className="text-slate-500 text-lg font-medium">
        Reach out about an order, a listing, your account, or anything else.
      </p>
    </Motion.div>

    <div className="grid sm:grid-cols-2 gap-6 mb-12">
      <a
        href="mailto:hello@petcenter.com"
        className="glass-card p-8 border-slate-100 flex flex-col gap-4 hover:border-primary/30 hover:-translate-y-1 transition-all"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Mail size={22} />
        </div>
        <div>
          <p className="font-black text-slate-900 mb-1">Email us</p>
          <p className="text-slate-500 font-medium text-sm">hello@petcenter.com</p>
        </div>
      </a>

      <div className="glass-card p-8 border-slate-100 flex flex-col gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Phone size={22} />
        </div>
        <div>
          <p className="font-black text-slate-900 mb-1">Call us</p>
          <p className="text-slate-500 font-medium text-sm">+1 (555) 000-0000</p>
        </div>
      </div>
    </div>

    <div className="grid sm:grid-cols-2 gap-6">
      <Link
        to="/help"
        className="glass-card p-8 border-slate-100 flex flex-col gap-4 hover:border-primary/30 hover:-translate-y-1 transition-all"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
          <LifeBuoy size={22} />
        </div>
        <div>
          <p className="font-black text-slate-900 mb-1">Browse the Help Center</p>
          <p className="text-slate-500 font-medium text-sm">Answers to common questions, no waiting required.</p>
        </div>
      </Link>

      <div className="glass-card p-8 border-slate-100 flex flex-col gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
          <MessageSquare size={22} />
        </div>
        <div>
          <p className="font-black text-slate-900 mb-1">Response time</p>
          <p className="text-slate-500 font-medium text-sm">We typically reply within one business day.</p>
        </div>
      </div>
    </div>
  </div>
);

export default Contact;
