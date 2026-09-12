import React from "react";
import { motion as Motion } from "framer-motion";

// Shared shell for content-only pages (legal, help, support) — no hero
// animation flourish, just a consistent, readable article layout.
export default function StaticPageLayout({ eyebrow, title, subtitle, updatedAt, children }) {
  return (
    <div className="max-w-3xl mx-auto">
      <Motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-14">
        {eyebrow && (
          <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[11px] font-black uppercase tracking-widest border border-primary/10">
            {eyebrow}
          </span>
        )}
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mt-4 mb-3">{title}</h1>
        {subtitle && <p className="text-slate-500 text-lg font-medium">{subtitle}</p>}
        {updatedAt && (
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-5">Last updated {updatedAt}</p>
        )}
      </Motion.div>
      <div
        className="space-y-10 text-slate-600 leading-relaxed font-medium
        [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:tracking-tight [&_h2]:mb-3
        [&_h3]:text-base [&_h3]:font-black [&_h3]:text-slate-800 [&_h3]:mb-2 [&_h3]:mt-5
        [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:mb-3
        [&_a]:text-primary [&_a]:font-bold hover:[&_a]:underline"
      >
        {children}
      </div>
    </div>
  );
}
