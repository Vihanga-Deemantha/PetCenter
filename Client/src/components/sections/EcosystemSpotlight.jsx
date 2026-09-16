import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Box } from "lucide-react";
import builderMockup from "../../assets/stunning_ecosystem_builder.png";

const STEPS = [
  { title: "Pick a species", desc: "Fish, reptile, bird — each with its own guidance." },
  { title: "Read the setup", desc: "Temperature, humidity and space, in plain language." },
  { title: "Choose essentials", desc: "Stock-aware, so nothing arrives half-complete." },
  { title: "Add the whole build", desc: "One cart, one delivery, ready on day one." },
];

const EcosystemSpotlight = () => (
  <section className="mt-24 bg-secondary text-light">
    <div className="max-w-7xl mx-auto px-7 py-22 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <Motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
        <p className="text-xs tracking-[0.18em] uppercase text-[#C8CFC1] font-semibold mb-5">Only at PetCenter</p>
        <h2 className="font-heading text-[34px] sm:text-[54px] font-medium leading-[1.1] mb-5.5 tracking-tight">
          Design the habitat
          <br />
          before you bring them home
        </h2>
        <p className="text-base leading-relaxed text-[#DCE0D6] max-w-115 mb-9">
          Pick a species, follow the setup guidance, and the builder assembles every essential — tank, substrate, lighting, enrichment — into one
          cart.
        </p>
        <div className="grid grid-cols-2 gap-5.5 mb-9.5">
          {STEPS.map((step) => (
            <div key={step.title} className="border-t border-light/22 pt-3.5">
              <p className="m-0 text-[15px] font-semibold text-white">{step.title}</p>
              <p className="mt-1.5 text-[13px] text-[#C8CFC1] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
        <Link to="/ecosystem" className="btn bg-primary text-white hover:bg-primary-dark px-7.5 py-4">
          Start a build
        </Link>
      </Motion.div>

      <Motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative"
      >
        <div className="rounded-[26px] overflow-hidden border border-light/20">
          <img src={builderMockup} alt="Ecosystem Builder" className="w-full h-auto block" />
        </div>
        <div className="absolute -right-5 -top-5 bg-light text-[#292925] rounded-2xl px-4.5 py-3.5 shadow-2xl shadow-black/40 flex items-center gap-3.5">
          <span className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Box size={20} />
          </span>
          <div>
            <p className="m-0 text-[11px] tracking-wider uppercase text-accent">Habitat layer</p>
            <p className="mt-0.5 text-sm font-semibold">Bio-active ready</p>
          </div>
        </div>
      </Motion.div>
    </div>
  </section>
);

export default EcosystemSpotlight;
