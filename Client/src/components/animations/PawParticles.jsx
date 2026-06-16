import React from "react";

/* ─────────────────────────────────────────────────────────────
   PawParticles
   Ambient floating 🐾 particles that drift upward across all
   pages. Entirely CSS-driven so there is zero JS per-frame cost.

   Uses CSS custom properties --paw-drift and --paw-opacity that
   are referenced inside the @keyframes floatUpPaw rule.
───────────────────────────────────────────────────────────── */

// Deterministic "random" values based on index so SSR-safe & stable
const generateParticles = () =>
  Array.from({ length: 16 }, (_, i) => {
    const seed = i + 1;
    return {
      id: i,
      left: ((seed * 6.25) % 100).toFixed(1),        // spread 0–100%
      delay: ((seed * 0.9) % 16).toFixed(2),          // 0–16s stagger
      duration: (10 + (seed * 2.3) % 10).toFixed(1), // 10–20s
      size: 10 + (seed % 5) * 3,                       // 10–22px
      drift: (((seed % 5) - 2) * 28).toFixed(0),      // -56 to +56px
      opacity: (0.10 + (seed % 4) * 0.05).toFixed(2), // 0.10–0.25
    };
  });

const PARTICLES = generateParticles();

const PawParticles = () => (
  <div
    className="paw-particles-wrap"
    style={{
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      zIndex: 0,
      overflow: "hidden",
    }}
    aria-hidden="true"
  >
    {PARTICLES.map((p) => (
      <span
        key={p.id}
        style={{
          position: "absolute",
          bottom: "-40px",
          left: `${p.left}%`,
          fontSize: `${p.size}px`,
          animation: `floatUpPaw ${p.duration}s ease-in-out ${p.delay}s infinite`,
          /* CSS custom props read by the @keyframes rule */
          "--paw-drift": `${p.drift}px`,
          "--paw-opacity": p.opacity,
          opacity: 0,
          userSelect: "none",
          lineHeight: 1,
          willChange: "transform, opacity",
        }}
      >
        🐾
      </span>
    ))}
  </div>
);

export default PawParticles;
