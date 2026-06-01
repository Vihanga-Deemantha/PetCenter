import React from "react";
import { motion as Motion } from "framer-motion";

/* ─────────────────────────────────────────────────────────────
   RunningDog  –  stylised golden-retriever silhouette
   Flying-gallop pose: front legs stretched forward (right),
   back legs stretched backward (left). Dog faces RIGHT.
   viewBox: 0 0 165 98
───────────────────────────────────────────────────────────── */
const RunningDog = () => (
  <svg
    viewBox="0 0 165 98"
    width="165"
    height="98"
    style={{ overflow: "visible", display: "block" }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="runBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="60%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="runDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>

    {/* ── TAIL (left side, curves up — wags via Framer Motion) ── */}
    <Motion.path
      d="M 36 56 C 20 44 14 27 25 12"
      stroke="url(#runDarkGrad)"
      strokeWidth="9"
      strokeLinecap="round"
      fill="none"
      animate={{ rotate: [-22, 28, -22] }}
      transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformBox: "fill-box", transformOrigin: "36px 56px" }}
    />

    {/* ── BODY ── */}
    <ellipse cx="78" cy="60" rx="44" ry="22" fill="url(#runBodyGrad)" />

    {/* ── NECK (blends body → head) ── */}
    <ellipse cx="113" cy="46" rx="15" ry="19" fill="url(#runBodyGrad)" />

    {/* ── HEAD ── */}
    <circle cx="128" cy="28" r="22" fill="url(#runBodyGrad)" />

    {/* ── SNOUT ── */}
    <ellipse cx="144" cy="34" rx="14" ry="10" fill="url(#runDarkGrad)" />

    {/* ── NOSE ── */}
    <ellipse cx="155" cy="32" rx="5.5" ry="4.5" fill="#1c1917" />

    {/* ── EYE ── */}
    <circle cx="131" cy="20" r="5.5" fill="#fefce8" />
    <circle cx="132" cy="21" r="3.2" fill="#1c1917" />
    <circle cx="133" cy="20" r="1.4" fill="white" />

    {/* ── EAR (floppy, drooping forward) ── */}
    <ellipse
      cx="114"
      cy="12"
      rx="11"
      ry="17"
      transform="rotate(-22 114 12)"
      fill="url(#runDarkGrad)"
    />

    {/* ── TONGUE (panting, happy!) ── */}
    <ellipse cx="151" cy="43" rx="5.5" ry="8" fill="#f87171" />
    <line
      x1="151"
      y1="35"
      x2="151"
      y2="42"
      stroke="#b45309"
      strokeWidth="1.8"
      strokeLinecap="round"
    />

    {/* ── BACK LEGS – stretched backward (left direction) ── */}
    {/* far back leg (slightly behind) */}
    <line
      x1="56"
      y1="76"
      x2="36"
      y2="97"
      stroke="url(#runDarkGrad)"
      strokeWidth="9"
      strokeLinecap="round"
    />
    {/* near back leg */}
    <line
      x1="68"
      y1="78"
      x2="50"
      y2="98"
      stroke="url(#runBodyGrad)"
      strokeWidth="10"
      strokeLinecap="round"
    />

    {/* ── FRONT LEGS – stretched forward (right direction) ── */}
    {/* far front leg (slightly behind) */}
    <line
      x1="103"
      y1="76"
      x2="120"
      y2="97"
      stroke="url(#runDarkGrad)"
      strokeWidth="9"
      strokeLinecap="round"
    />
    {/* near front leg */}
    <line
      x1="115"
      y1="74"
      x2="130"
      y2="95"
      stroke="url(#runBodyGrad)"
      strokeWidth="10"
      strokeLinecap="round"
    />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   Paw‑print trail positions along the ground (% of viewport)
   Each paw's animation-delay = (left / 100) × DURATION_S
   so it appears exactly as the dog passes over it.
───────────────────────────────────────────────────────────── */
const DURATION_S = 6; // must match dogRunAcross / dogJumpCycle duration

const PAW_TRAIL = [3, 8, 14, 20, 27, 33, 40, 47, 54, 61, 68, 75, 82, 89, 95];

/* ─────────────────────────────────────────────────────────────
   DogMascot  –  the full running + jumping mascot strip.
   Place inside a `position: relative` section container.
───────────────────────────────────────────────────────────── */
const DogMascot = () => (
  <div
    className="dog-mascot-wrap"
    style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "120px",
      pointerEvents: "none",
      overflow: "hidden",
      zIndex: 6,
    }}
  >
    {/* Subtle ground glow line */}
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "3px",
        background:
          "linear-gradient(90deg, transparent, rgba(99,102,241,0.18) 50%, transparent)",
      }}
    />

    {/* ── PAW TRAIL ── */}
    {PAW_TRAIL.map((leftPct, i) => (
      <span
        key={i}
        style={{
          position: "absolute",
          bottom: "8px",
          left: `${leftPct}%`,
          fontSize: "14px",
          animation: `pawFadeTrail ${DURATION_S}s ease-in-out ${(leftPct / 100) * DURATION_S}s infinite`,
          opacity: 0,
          display: "inline-block",
          /* Alternate left/right paw slant */
          transform: `rotate(${i % 2 === 0 ? "12deg" : "-12deg"})`,
          userSelect: "none",
          lineHeight: 1,
        }}
        aria-hidden="true"
      >
        🐾
      </span>
    ))}

    {/* ── DOG RUNNER ──
        Outer div: handles Y (jump arc via dogJumpCycle)
        Inner div: handles X (constant run via dogRunAcross)
        Combined effect → parabolic jump arc near screen centre
    ── */}
    <div
      style={{
        position: "absolute",
        bottom: "10px",
        left: 0,
        animation: `dogJumpCycle ${DURATION_S}s ease-in-out infinite`,
      }}
    >
      <div
        style={{
          animation: `dogRunAcross ${DURATION_S}s linear infinite`,
        }}
      >
        <RunningDog />
      </div>
    </div>
  </div>
);

export default DogMascot;
