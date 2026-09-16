import React, { useState, useEffect, useRef, useCallback } from "react";

// A small, ambient homepage decoration — not the old app-wide interactive
// playground. Appears once the visitor scrolls past the hero, tracks the
// cursor with its eyes, and cycles through a few tricks on its own. Scoped
// entirely to Home.jsx; unlike the previous mascot system, nothing renders
// it on any other page.
const MOVES = ["speak", "spin", "jump", "beg", "dig", "dead"];
const PHRASES = ["Woof.", "Arf!", "Hello there.", "Ready when you are."];

const ANIM = {
  spin: "dogSpin .9s ease-in-out",
  jump: "dogJump 1.1s cubic-bezier(.3,.8,.4,1)",
  dead: "dogDead 1.6s ease-in-out forwards",
  dig: "dogDig .34s ease-in-out 5",
  beg: "dogBeg 1.6s ease-in-out forwards",
};

export default function HomeDogMascot() {
  const [visible, setVisible] = useState(false);
  const [trick, setTrick] = useState("idle");
  const [bubble, setBubble] = useState("");
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState(0);

  const bubbleT = useRef(null);
  const trickT = useRef(null);
  const tiltT = useRef(null);
  const autoT = useRef(null);
  const lastMove = useRef(-1);
  const lastScrollY = useRef(0);

  const say = useCallback((text, ms = 2200) => {
    clearTimeout(bubbleT.current);
    setBubble(text);
    bubbleT.current = setTimeout(() => setBubble(""), ms);
  }, []);

  const doTrick = useCallback(
    (name, phrase, ms) => {
      setTrick((current) => {
        if (current !== "idle") return current;
        say(phrase, ms);
        clearTimeout(trickT.current);
        trickT.current = setTimeout(() => setTrick("idle"), ms);
        return name;
      });
    },
    [say]
  );

  // Scroll reveal + gentle head-tilt on scroll direction
  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const onScroll = () => {
      const dy = window.scrollY - lastScrollY.current;
      lastScrollY.current = window.scrollY;
      const past = window.scrollY > window.innerHeight * 0.8;
      setVisible(past);
      if (Math.abs(dy) < 5) return;
      setTilt(dy > 0 ? -8 : 8);
      clearTimeout(tiltT.current);
      tiltT.current = setTimeout(() => setTilt(0), 380);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cursor eye-tracking
  useEffect(() => {
    const onMove = (e) => {
      const cx = window.innerWidth - 120;
      const cy = window.innerHeight - 110;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(d / 60, 4.5);
      setPupil({ x: (dx / d) * k, y: (dy / d) * k });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Occasional autonomous trick while visible
  useEffect(() => {
    const tick = () => {
      if (visible) {
        setTrick((current) => {
          if (current !== "idle") return current;
          let i = Math.floor(Math.random() * MOVES.length);
          if (i === lastMove.current) i = (i + 1) % MOVES.length;
          lastMove.current = i;
          const move = MOVES[i];
          const ms = move === "speak" ? 1400 : move === "spin" ? 900 : move === "jump" ? 1100 : move === "beg" ? 1800 : move === "dig" ? 1700 : 2000;
          const phrase = move === "speak" ? PHRASES[Math.floor(Math.random() * PHRASES.length)] : move === "spin" ? "Wheee —" : move === "jump" ? "Backflip!" : move === "beg" ? "Just one treat?" : move === "dig" ? "Digging..." : "...";
          say(phrase, ms);
          clearTimeout(trickT.current);
          trickT.current = setTimeout(() => setTrick("idle"), ms);
          return move;
        });
      }
      autoT.current = setTimeout(tick, 4200 + Math.random() * 4200);
    };
    autoT.current = setTimeout(tick, 2600);
    return () => {
      [bubbleT.current, trickT.current, tiltT.current, autoT.current].forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const isDead = trick === "dead";
  const isSpeakOrBeg = trick === "speak" || trick === "beg";

  return (
    <div
      className="home-dog-mascot fixed right-5.5 bottom-4.5 z-[120] flex flex-col items-end gap-2.5 pointer-events-none transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {bubble && (
        <div className="pointer-events-none bg-dark/95 text-light text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg max-w-37.5 text-center relative">
          {bubble}
        </div>
      )}
      <button
        onClick={() => doTrick("speak", "Woof!", 1200)}
        onMouseEnter={() => say("Hi. 🐾", 1500)}
        aria-label="Pet the dog"
        className="pointer-events-auto relative w-47.5 h-45 cursor-pointer bg-transparent border-none p-0"
        style={{ transformOrigin: "50% 85%", animation: ANIM[trick] }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="homeDogBody" x1="0" y1="0" x2="0.2" y2="1">
              <stop offset="0%" stopColor="#E39B5F" />
              <stop offset="55%" stopColor="#CC7A3F" />
              <stop offset="100%" stopColor="#A85C28" />
            </linearGradient>
            <linearGradient id="homeDogHead" x1="0.1" y1="0" x2="0.6" y2="1">
              <stop offset="0%" stopColor="#F0B57C" />
              <stop offset="100%" stopColor="#D2854A" />
            </linearGradient>
            <linearGradient id="homeDogDark" x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0%" stopColor="#B9642F" />
              <stop offset="100%" stopColor="#8F4A1E" />
            </linearGradient>
          </defs>
          <ellipse cx="100" cy="180" rx="56" ry="9" fill="rgba(41,41,37,.14)" />
          <path
            d="M 52 142 C 22 135 8 112 14 88"
            stroke="url(#homeDogDark)"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
            style={{ transformBox: "fill-box", transformOrigin: "0% 100%", animation: "tailWag .9s ease-in-out infinite" }}
          />
          <ellipse cx="65" cy="164" rx="15" ry="11" fill="url(#homeDogDark)" />
          <circle cx="60" cy="172" r="7.5" fill="#E39B5F" />
          <g style={{ animation: "breathe 3.6s ease-in-out infinite" }}>
            <ellipse cx="98" cy="142" rx="44" ry="27" fill="url(#homeDogBody)" />
            <ellipse cx="98" cy="150" rx="40" ry="17" fill="#E8DCC8" opacity="0.55" />
            <rect x="110" y="142" width="11" height="34" rx="5.5" fill="url(#homeDogDark)" />
            <rect x="128" y="142" width="12" height="34" rx="6" fill="url(#homeDogBody)" />
            <circle cx="134" cy="174" r="2.6" fill="#8F4A1E" />
            <path d="M 115 125 L 138 100 L 122 90 L 96 114 Z" fill="url(#homeDogBody)" />
            <path d="M 112 121 L 132 101" stroke="#4F5B4B" strokeWidth="7" strokeLinecap="round" />
            <circle cx="122" cy="113" r="5" fill="#E8E2D8" />
            <g style={{ transform: `rotate(${tilt}deg)`, transformBox: "fill-box", transformOrigin: "30% 70%", transition: "transform .35s ease-out" }}>
              {/* Far ear — perked, peeking out from behind the head */}
              <path d="M 138 66 Q 150 28 168 40 Q 161 60 148 65 Q 143 66 138 66 Z" fill="url(#homeDogDark)" />
              <circle cx="130" cy="78" r="26" fill="url(#homeDogHead)" />
              <ellipse cx="147" cy="84" rx="16" ry="11" fill="#F5C793" />
              <ellipse cx="160" cy="79" rx="5.5" ry="4.5" fill="#292925" />
              <circle cx="158" cy="77" r="1.2" fill="#fff" />
              {isSpeakOrBeg ? (
                <g>
                  <path d="M 143 89 Q 152 99 156 89 Z" fill="#8C4A34" />
                  <ellipse cx="150" cy="93" rx="4.5" ry="5.5" fill="#C87550" />
                </g>
              ) : (
                <path d="M 141 85 Q 150 91 155 85" stroke="#95501F" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              )}
              <path
                d="M 118 64 C 100 72 96 100 108 112 C 116 106 120 88 122 70 Q 121 66 118 64 Z"
                fill="url(#homeDogDark)"
                style={{ transformBox: "fill-box", transformOrigin: "118px 64px", animation: "tailWag 3.5s ease-in-out infinite" }}
              />
              <path d="M 125 61 Q 130 58 135 62" stroke="#95501F" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M 144 61 Q 149 58 154 62" stroke="#95501F" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              {isDead ? (
                <g>
                  <path d="M 127 72 Q 132 77 137 72" stroke="#95501F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M 144 72 Q 149 77 154 72" stroke="#95501F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </g>
              ) : (
                <g>
                  <circle cx="132" cy="72" r="7.5" fill="#fff" />
                  <circle cx="150" cy="72" r="7.5" fill="#fff" />
                  <circle cx="132" cy="72" r="4.5" fill="#292925" style={{ transform: `translate(${pupil.x}px,${pupil.y}px)`, transition: "transform .18s ease-out" }} />
                  <circle cx="150" cy="72" r="4.5" fill="#292925" style={{ transform: `translate(${pupil.x}px,${pupil.y}px)`, transition: "transform .18s ease-out" }} />
                  <circle cx="133.8" cy="70.2" r="1.3" fill="#fff" />
                  <circle cx="151.8" cy="70.2" r="1.3" fill="#fff" />
                </g>
              )}
            </g>
          </g>
        </svg>
      </button>
    </div>
  );
}
