import React from "react";
import { motion as Motion } from "framer-motion";

/* ─────────────────────────────────────────────────────────────
   PetBounceIcon
   A tiny inline component that renders an emoji (or any text)
   with a gentle perpetual bounce. Drop it next to section
   headings for an animated, pet-themed accent.

   Usage:
     <h2><PetBounceIcon /> Featured Pets</h2>
     <h2><PetBounceIcon emoji="🐶" delay={0.4} /> Meet Our Dogs</h2>
───────────────────────────────────────────────────────────── */
const PetBounceIcon = ({
  emoji = "🐾",
  delay = 0,
  size = "1em",
  className = "",
}) => (
  <Motion.span
    className={`pet-bounce-icon inline-block select-none ${className}`}
    aria-hidden="true"
    animate={{ y: [0, -7, -4, 0] }}
    transition={{
      duration: 1.8,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
      repeatDelay: 0.4,
    }}
    style={{ display: "inline-block", fontSize: size }}
  >
    {emoji}
  </Motion.span>
);

export default PetBounceIcon;
