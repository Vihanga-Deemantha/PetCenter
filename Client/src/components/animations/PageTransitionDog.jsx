import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/* ─────────────────────────────────────────────────────────────
   SmallDogSVG  –  compact version of the running dog
   (scaled down to ~110×68 px, same proportions as DogMascot)
───────────────────────────────────────────────────────────── */
const SmallDogSVG = () => (
  <svg
    viewBox="0 0 165 98"
    width="110"
    height="65"
    style={{ overflow: "visible", display: "block" }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="transBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="60%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="transDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
    {/* Tail */}
    <path
      d="M 36 56 C 20 44 14 27 25 12"
      stroke="url(#transDarkGrad)"
      strokeWidth="9"
      strokeLinecap="round"
      fill="none"
      style={{
        transformBox: "fill-box",
        transformOrigin: "36px 56px",
        animation: "tailWag 0.4s ease-in-out infinite",
      }}
    />
    {/* Body */}
    <ellipse cx="78" cy="60" rx="44" ry="22" fill="url(#transBodyGrad)" />
    {/* Neck */}
    <ellipse cx="113" cy="46" rx="15" ry="19" fill="url(#transBodyGrad)" />
    {/* Head */}
    <circle cx="128" cy="28" r="22" fill="url(#transBodyGrad)" />
    {/* Snout */}
    <ellipse cx="144" cy="34" rx="14" ry="10" fill="url(#transDarkGrad)" />
    {/* Nose */}
    <ellipse cx="155" cy="32" rx="5.5" ry="4.5" fill="#1c1917" />
    {/* Eye */}
    <circle cx="131" cy="20" r="5.5" fill="#fefce8" />
    <circle cx="132" cy="21" r="3.2" fill="#1c1917" />
    <circle cx="133" cy="20" r="1.4" fill="white" />
    {/* Ear */}
    <ellipse
      cx="114" cy="12" rx="11" ry="17"
      transform="rotate(-22 114 12)"
      fill="url(#transDarkGrad)"
    />
    {/* Tongue */}
    <ellipse cx="151" cy="43" rx="5.5" ry="8" fill="#f87171" />
    {/* Back legs */}
    <line x1="56" y1="76" x2="36" y2="97" stroke="url(#transDarkGrad)" strokeWidth="9" strokeLinecap="round" />
    <line x1="68" y1="78" x2="50" y2="98" stroke="url(#transBodyGrad)" strokeWidth="10" strokeLinecap="round" />
    {/* Front legs */}
    <line x1="103" y1="76" x2="120" y2="97" stroke="url(#transDarkGrad)" strokeWidth="9" strokeLinecap="round" />
    <line x1="115" y1="74" x2="130" y2="95" stroke="url(#transBodyGrad)" strokeWidth="10" strokeLinecap="round" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   PageTransitionDog
   Watches route changes and sweeps a dog across the screen
   whenever the user navigates to a new page.
   - Renders as a fixed overlay (z-index 9999), pointer-events none
   - Auto-hides after 1.3 s (duration of dogPageWipe animation)
───────────────────────────────────────────────────────────── */
const WIPE_DURATION_MS = 1300;

const PageTransitionDog = () => {
  const location = useLocation();
  const [isRunning, setIsRunning] = useState(false);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    // Only trigger on actual path changes (not on first render)
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname;
      setIsRunning(true);
      const t = setTimeout(() => setIsRunning(false), WIPE_DURATION_MS);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  if (!isRunning) return null;

  return (
    <div
      className="page-transition-dog"
      style={{
        position: "fixed",
        /* Vertically centred in the viewport */
        top: "50%",
        left: 0,
        transform: "translateY(-50%)",
        zIndex: 9999,
        pointerEvents: "none",
        /* X movement handled by dogPageWipe keyframe */
        animation: `dogPageWipe ${WIPE_DURATION_MS}ms ease-in-out forwards`,
        /* Drop shadow so the dog is visible against any page bg */
        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.18))",
      }}
      aria-hidden="true"
    >
      <SmallDogSVG />
    </div>
  );
};

export default PageTransitionDog;
