import React from "react";
import { motion as Motion } from "framer-motion";

const STEPS = [
  { n: "01", title: "Create an account", desc: "One profile for adopting, shopping and donating." },
  { n: "02", title: "Find or list", desc: "Browse verified listings, or post a pet of your own." },
  { n: "03", title: "Build the habitat", desc: "Let the builder handle the setup list for you." },
  { n: "04", title: "Support a shelter", desc: "A share of every order goes back to rescue work." },
];

const HowItWorksSection = () => (
  <section className="max-w-7xl mx-auto px-7 pt-24">
    <div className="text-center mb-13">
      <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-3">How it works</p>
      <h2 className="font-heading text-[32px] sm:text-[46px] font-medium text-[#292925] tracking-tight">Four unhurried steps</h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
      {STEPS.map((step, i) => (
        <Motion.div
          key={step.n}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          viewport={{ once: true }}
          className="border-t border-[#ddd6c8] pt-5"
        >
          <p className="font-heading text-[34px] text-accent m-0 mb-2.5">{step.n}</p>
          <h3 className="m-0 mb-2 text-[17px] font-semibold text-[#292925]">{step.title}</h3>
          <p className="m-0 text-sm leading-relaxed text-[#6e6e64]">{step.desc}</p>
        </Motion.div>
      ))}
    </div>
  </section>
);

export default HowItWorksSection;
