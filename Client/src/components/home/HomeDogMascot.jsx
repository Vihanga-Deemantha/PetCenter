import React, { useState, useEffect, useRef, useCallback } from "react";

// A small, ambient homepage decoration — not the old app-wide interactive
// playground. Appears once the visitor scrolls past the hero, tracks the
// cursor with its eyes, and cycles through a few tricks on its own. Scoped
// entirely to Home.jsx; unlike the previous mascot system, nothing renders
// it on any other page.
const MOVES = ["speak", "jump", "beg"];
const PHRASES = ["Woof.", "Hello there.", "Need a paw?", "Ready when you are."];

const ANIM = {
  jump: "dogJump 1.15s cubic-bezier(.3,.8,.4,1)",
  beg: "dogBeg 1.35s ease-in-out",
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
  const moveFrame = useRef(null);
  const reduceMotion = useRef(false);
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
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      reduceMotion.current = motionPreference.matches;
    };
    updateMotionPreference();
    motionPreference.addEventListener("change", updateMotionPreference);

    lastScrollY.current = window.scrollY;
    const onScroll = () => {
      const dy = window.scrollY - lastScrollY.current;
      lastScrollY.current = window.scrollY;
      const past = window.scrollY > window.innerHeight * 0.8;
      setVisible(past);
      if (!past || reduceMotion.current || Math.abs(dy) < 5) return;
      setTilt(dy > 0 ? -8 : 8);
      clearTimeout(tiltT.current);
      tiltT.current = setTimeout(() => setTilt(0), 380);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      motionPreference.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  // Cursor eye-tracking
  useEffect(() => {
    const onMove = (e) => {
      if (reduceMotion.current || moveFrame.current) return;
      const { clientX, clientY } = e;
      moveFrame.current = window.requestAnimationFrame(() => {
        const cx = window.innerWidth - 95;
        const cy = window.innerHeight - 85;
        const dx = clientX - cx;
        const dy = clientY - cy;
        const distance = Math.hypot(dx, dy) || 1;
        const offset = Math.min(distance / 70, 3.75);
        setPupil({ x: (dx / distance) * offset, y: (dy / distance) * offset });
        moveFrame.current = null;
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (moveFrame.current) window.cancelAnimationFrame(moveFrame.current);
    };
  }, []);

  // Occasional autonomous trick while visible
  useEffect(() => {
    const tick = () => {
      if (visible && !reduceMotion.current && document.visibilityState === "visible") {
        setTrick((current) => {
          if (current !== "idle") return current;
          let i = Math.floor(Math.random() * MOVES.length);
          if (i === lastMove.current) i = (i + 1) % MOVES.length;
          lastMove.current = i;
          const move = MOVES[i];
          const ms = move === "speak" ? 1400 : 1500;
          const phrase = move === "speak"
            ? PHRASES[Math.floor(Math.random() * PHRASES.length)]
            : move === "jump"
              ? "Good to see you!"
              : "Just one treat?";
          say(phrase, ms);
          clearTimeout(trickT.current);
          trickT.current = setTimeout(() => setTrick("idle"), ms);
          return move;
        });
      }
      autoT.current = setTimeout(tick, 9000 + Math.random() * 6000);
    };
    autoT.current = setTimeout(tick, 6500);
    return () => {
      [bubbleT.current, trickT.current, tiltT.current, autoT.current].forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const isSpeakOrBeg = trick === "speak" || trick === "beg";

  return (
    <div
      className="home-dog-mascot fixed right-3 bottom-3 z-[120] flex flex-col items-end gap-2 pointer-events-none sm:right-5 sm:bottom-4"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {bubble && (
        <div className="home-dog-bubble pointer-events-none relative max-w-37.5 rounded-xl bg-dark/95 px-3 py-1.5 text-center text-[11px] font-semibold text-light shadow-lg sm:text-xs">
          {bubble}
        </div>
      )}
      <button
        onClick={() => doTrick("beg", "Thanks for the pat. 🐾", 1500)}
        onMouseEnter={() => say("Need a paw? 🐾", 1500)}
        aria-label="Pet the dog"
        title="Pet the dog"
        className="home-dog-button pointer-events-auto relative h-32 w-34 cursor-pointer border-none bg-transparent p-0 sm:h-38 sm:w-40"
        style={{ transformOrigin: "50% 85%", animation: ANIM[trick] }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full overflow-visible"
          aria-hidden="true"
          focusable="false"
        >
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
            <linearGradient id="homeDogEarInner" x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#D9875C" />
              <stop offset="100%" stopColor="#A95735" />
            </linearGradient>
            <linearGradient id="homeDogCream" x1="0" y1="0" x2="0.7" y2="1">
              <stop offset="0%" stopColor="#FFF2D8" />
              <stop offset="100%" stopColor="#E9CEAA" />
            </linearGradient>
            <filter id="homeDogSoftShadow" x="-25%" y="-25%" width="150%" height="165%">
              <feDropShadow dx="0" dy="3" stdDeviation="2.4" floodColor="#292925" floodOpacity="0.2" />
            </filter>
          </defs>
          <ellipse cx="99" cy="180" rx="56" ry="8" fill="rgba(41,41,37,.13)" />
          <g
            style={{
              transformBox: "fill-box",
              transformOrigin: "100% 100%",
              animation: "tailWag 1.45s ease-in-out infinite",
            }}
          >
            <path
              d="M 58 144 C 39 143 27 135 21 123 C 15 112 17 98 25 88"
              stroke="url(#homeDogDark)"
              strokeWidth="11"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 21 105 C 20 99 21 93 25 88"
              stroke="url(#homeDogCream)"
              strokeWidth="6.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>
          <g filter="url(#homeDogSoftShadow)" style={{ animation: "breathe 3.6s ease-in-out infinite" }}>
            {/* Rear leg sits behind the body to give the pose some depth. */}
            <path
              d="M 58 145 C 52 151 51 164 56 171 C 60 177 72 178 80 174 L 80 168 C 72 166 70 157 73 148 Z"
              fill="url(#homeDogDark)"
            />
            <ellipse cx="67" cy="173" rx="13" ry="7" fill="#C8733B" />

            {/* A shaped torso replaces the old oval and creates a natural chest and rump. */}
            <path
              d="M 51 143 C 51 127 63 115 80 112 C 98 109 115 114 127 126 C 136 135 139 150 134 162 C 129 173 116 178 96 178 L 75 177 C 59 176 50 163 51 143 Z"
              fill="url(#homeDogBody)"
            />
            <path
              d="M 59 133 C 67 119 84 116 100 117 C 89 120 81 126 77 137 C 72 150 77 164 88 174 L 74 173 C 59 171 53 158 55 145 C 55 140 56 136 59 133 Z"
              fill="url(#homeDogCream)"
              opacity="0.9"
            />
            <path
              d="M 62 126 C 76 115 101 113 118 124"
              stroke="#F2B67D"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              opacity="0.72"
            />

            {/* Front legs and soft, grounded paws. */}
            <path
              d="M 111 140 C 107 150 108 164 111 172 C 115 177 124 177 129 173 L 128 145 Z"
              fill="url(#homeDogDark)"
            />
            <ellipse cx="120" cy="173" rx="12" ry="6.5" fill="#A85C28" />
            <path
              d="M 127 137 C 125 149 126 164 130 172 C 134 178 145 178 151 173 L 148 141 Z"
              fill="url(#homeDogBody)"
            />
            <ellipse cx="140" cy="173" rx="12.5" ry="6.7" fill="#D9874D" />
            <path d="M 116 172 L 116 175 M 122 171.5 L 123 175" stroke="#7F411D" strokeWidth="1.35" strokeLinecap="round" />
            <path d="M 136 171.5 L 136 175 M 143 171.5 L 144 175" stroke="#95501F" strokeWidth="1.35" strokeLinecap="round" />

            {/* Curved neck and collar visually connect the head to the body. */}
            <path
              d="M 104 124 C 106 110 113 99 122 91 C 128 89 137 95 140 102 C 132 111 128 123 128 138 C 119 137 110 132 104 124 Z"
              fill="url(#homeDogBody)"
            />
            <path d="M 111 116 Q 121 122 132 116" stroke="#4F5B4B" strokeWidth="6.5" strokeLinecap="round" fill="none" />
            <circle cx="122" cy="121" r="5.2" fill="#E8E2D8" stroke="#A9A296" strokeWidth="1" />
            <circle cx="120.5" cy="119.5" r="1.25" fill="#fff" opacity="0.8" />
            <g style={{ transform: `rotate(${tilt}deg)`, transformBox: "fill-box", transformOrigin: "30% 70%", transition: "transform .35s ease-out" }}>
              {/* Far ear — a smaller floppy ear set behind the head. */}
              <g style={{ transformBox: "fill-box", transformOrigin: "18% 18%", animation: "earPerk 6.4s ease-in-out 1.2s infinite" }}>
                <path
                  d="M 142 64 C 152 52 166 50 173 57 C 181 65 174 79 161 90 C 156 94 151 92 148 85 C 145 77 142 69 142 64 Z"
                  fill="url(#homeDogDark)"
                  stroke="#8F4A1E"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M 151 62 C 158 57 166 57 169 61 C 173 67 168 77 158 84 C 155 80 152 71 151 62 Z"
                  fill="url(#homeDogEarInner)"
                  opacity="0.66"
                />
              </g>
              <path
                d="M 108 76 C 107 61 117 51 132 50 C 148 49 160 60 161 75 C 163 89 154 103 139 107 C 124 110 111 101 109 88 C 108 84 108 80 108 76 Z"
                fill="url(#homeDogHead)"
              />
              <path
                d="M 122 54 C 128 51 135 51 141 54 C 135 57 132 62 130 68 C 127 63 125 58 122 54 Z"
                fill="url(#homeDogCream)"
                opacity="0.58"
              />
              <ellipse cx="137" cy="87" rx="11.5" ry="12" fill="#F3BE85" />
              <ellipse cx="149" cy="85" rx="15" ry="11.5" fill="#F7CF9D" />
              <path
                d="M 157 76 C 162 75 166 78 166 81 C 166 85 162 88 158 87 C 155 86 153 82 154 79 C 154 78 155 77 157 76 Z"
                fill="#292925"
              />
              <ellipse cx="160" cy="78.5" rx="1.6" ry="1" fill="#fff" opacity="0.75" />
              <circle cx="143" cy="86" r="1.1" fill="#B26C43" opacity="0.75" />
              <circle cx="147" cy="89" r="1" fill="#B26C43" opacity="0.7" />
              <circle cx="151" cy="87.5" r="0.9" fill="#B26C43" opacity="0.65" />
              {isSpeakOrBeg ? (
                <g>
                  <path d="M 139 94 Q 149 103 157 92 Q 153 106 144 104 Q 139 101 139 94 Z" fill="#713C2B" />
                  <ellipse cx="149" cy="99" rx="5" ry="5.5" fill="#C87568" />
                </g>
              ) : (
                <path d="M 139 93 Q 147 98 155 92" stroke="#95501F" strokeWidth="2" strokeLinecap="round" fill="none" />
              )}
              {/* Near ear — layered for a softer edge and more natural depth. */}
              <g style={{ transformBox: "fill-box", transformOrigin: "82% 8%", animation: "earPerk 5.6s ease-in-out infinite" }}>
                <path
                  d="M 118 62 C 105 62 96 72 94 86 C 92 100 100 113 111 119 C 118 111 123 98 124 83 C 125 72 123 65 118 62 Z"
                  fill="url(#homeDogDark)"
                  stroke="#8F4A1E"
                  strokeWidth="1.25"
                  strokeLinejoin="round"
                />
                <path
                  d="M 113 70 C 105 73 100 82 100 92 C 100 101 105 109 110 112 C 114 105 118 92 119 81 C 119 75 117 71 113 70 Z"
                  fill="url(#homeDogEarInner)"
                  opacity="0.72"
                />
                <path
                  d="M 102 101 C 105 107 108 111 111 113"
                  fill="none"
                  stroke="#E5A177"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </g>
              <path d="M 123 62 Q 129 58 135 62" stroke="#95501F" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M 142 61 Q 148 58 154 62" stroke="#95501F" strokeWidth="2" strokeLinecap="round" fill="none" />
              <g>
                <ellipse cx="130" cy="72" rx="6.7" ry="7.2" fill="#FFFDF7" />
                <ellipse cx="148" cy="72" rx="6.7" ry="7.2" fill="#FFFDF7" />
                <circle cx="130" cy="72" r="4" fill="#292925" style={{ transform: `translate(${pupil.x}px,${pupil.y}px)`, transition: "transform .18s ease-out" }} />
                <circle cx="148" cy="72" r="4" fill="#292925" style={{ transform: `translate(${pupil.x}px,${pupil.y}px)`, transition: "transform .18s ease-out" }} />
                <circle cx="131.5" cy="70.3" r="1.2" fill="#fff" />
                <circle cx="149.5" cy="70.3" r="1.2" fill="#fff" />
                <path d="M 124 68 Q 130 64.5 136 68" stroke="#9E582D" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.8" />
                <path d="M 142 68 Q 148 64.5 154 68" stroke="#9E582D" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.8" />
              </g>
            </g>
          </g>
        </svg>
      </button>
    </div>
  );
}
