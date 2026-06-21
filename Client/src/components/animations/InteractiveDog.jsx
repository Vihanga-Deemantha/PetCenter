import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Bone, Circle, Sparkles, Smile, Volume2, VolumeX, Moon } from "lucide-react";
import { playBarkSound, playMunchSound, playHappyYip } from "../../utils/soundEffects";

// Decorative sparkles for tricks
const SparkleParticle = ({ x, y, driftX, delay }) => (
  <Motion.span
    initial={{ scale: 0, opacity: 1, x, y }}
    animate={{ 
      scale: [0, 1.2, 0], 
      opacity: [1, 1, 0],
      y: y - 50,
      x: x + driftX
    }}
    transition={{ duration: 0.8, ease: "easeOut", delay }}
    className="absolute text-amber-400 pointer-events-none select-none text-lg z-30"
  >
    ✨
  </Motion.span>
);

const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

const InteractiveDog = ({ compact = false }) => {
  // States
  const [mood, setMood] = useState("Happy 💖");
  const [currentState, setCurrentState] = useState("idle"); // idle, sleeping, barking, rolling, shaking, eating, fetching
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speechBubble, setSpeechBubble] = useState(null); // text to show in bubble
  const [zzzList, setZzzList] = useState([]); // list of Zzz particles
  const [heartList, setHeartList] = useState([]); // list of heart particles
  const [sparkleList, setSparkleList] = useState([]); // list of sparkles

  // Playground items
  const [treat, setTreat] = useState(null); // { x, y, type: 'bone' | 'ball' }
  
  // Mascot displacement for fetching/feeding
  const [dogX, setDogX] = useState(0);
  const [dogScaleX, setDogScaleX] = useState(1);

  // References
  const dogRef = useRef(null);
  const playAreaRef = useRef(null);
  const zzzIdCounter = useRef(0);
  const heartIdCounter = useRef(0);
  const sparkleIdCounter = useRef(0);
  const sleepTimeoutRef = useRef(null);
  const petCountRef = useRef(0);

  const [compactMotion, setCompactMotion] = useState({ x: 0, y: 0, rotate: 0, scale: 1, flip: 1 });
  const [compactFace, setCompactFace] = useState("cute");

  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  // 1. Pure Speech bubble helper
  const showSpeech = useCallback((text, duration = 2500) => {
    setSpeechBubble(text);
    const t = setTimeout(() => {
      setSpeechBubble((curr) => (curr === text ? null : curr));
    }, duration);
    return () => clearTimeout(t);
  }, []);

  // 2. Pure Sparkles generator
  const triggerSparkles = useCallback((relativeX, relativeY, count = 6) => {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        id: sparkleIdCounter.current++,
        x: relativeX + (Math.random() - 0.5) * 30,
        y: relativeY + (Math.random() - 0.5) * 30,
        driftX: (Math.random() - 0.5) * 40,
        delay: i * 0.08
      });
    }
    setSparkleList((prev) => [...prev, ...list]);
    setTimeout(() => {
      setSparkleList((prev) => prev.filter((s) => !list.find((l) => l.id === s.id)));
    }, 1500);
  }, []);

  // 3. Reset sleep timer (depends on currentState & showSpeech)
  const resetSleepTimeout = useCallback(() => {
    if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
    if (currentState !== "sleeping") {
      sleepTimeoutRef.current = setTimeout(() => {
        setCurrentState("sleeping");
        setMood("Dreaming 😴");
        showSpeech("Zzz...");
        setPupilOffset({ x: 0, y: 0 });
      }, 15000); // sleep after 15s of inactivity
    }
  }, [currentState, showSpeech]);

  // 4. Handle global mouse move for eye-tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Wake up if sleeping
      if (currentState === "sleeping") {
        setCurrentState("idle");
        setMood("Happy 💖");
        triggerSparkles(0, -30);
        if (soundEnabled) playHappyYip();
        showSpeech("Aww, hello! 🐾");
      }

      // Calculate pupil tracking offset
      if (currentState !== "sleeping" && dogRef.current) {
        const rect = dogRef.current.getBoundingClientRect();
        if (rect) {
          const dogCenterX = rect.left + rect.width * 0.65;
          const dogCenterY = rect.top + rect.height * 0.35;
          const dx = e.clientX - dogCenterX;
          const dy = e.clientY - dogCenterY;
          const dist = Math.hypot(dx, dy);

          if (dist <= 10) {
            setPupilOffset({ x: 0, y: 0 });
          } else {
            const angle = Math.atan2(dy, dx);
            const maxDisplacement = 4.5;
            const scaleDist = Math.min(dist / 60, maxDisplacement);
            setPupilOffset({
              x: Math.cos(angle) * scaleDist,
              y: Math.sin(angle) * scaleDist,
            });
          }
        }
      }

      // Reset sleep timeout
      resetSleepTimeout();
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
    };
  }, [currentState, soundEnabled, resetSleepTimeout, triggerSparkles, showSpeech]);

  // Initialize sleep timer on load
  useEffect(() => {
    resetSleepTimeout();
  }, [resetSleepTimeout]);

  // Sleep Zzz generator loop
  useEffect(() => {
    if (currentState !== "sleeping") {
      return;
    }

    const interval = setInterval(() => {
      const id = zzzIdCounter.current++;
      setZzzList((prev) => [...prev, { id, time: Date.now() }]);
      
      // Clean up after 2s
      setTimeout(() => {
        setZzzList((prev) => prev.filter((z) => z.id !== id));
      }, 2000);
    }, 1200);

    return () => {
      clearInterval(interval);
      setZzzList([]);
    };
  }, [currentState]);

  // 🗣️ Bark action
  const handleBark = () => {
    if (currentState === "rolling" || currentState === "eating" || currentState === "fetching") return;
    setCurrentState("barking");
    setMood("Playful! 🗣️");
    if (soundEnabled) playBarkSound();
    
    // Choose cute barking quote
    const barks = ["Woof! 🐾", "Arf! 🐶", "Bow-wow! 💕", "Welcome! 🌟"];
    const phrase = barks[Math.floor(Math.random() * barks.length)];
    showSpeech(phrase, 1200);
    triggerSparkles(60, -20, 4);

    setTimeout(() => {
      setCurrentState("idle");
      setMood("Happy 💖");
    }, 1000);
  };

  // 🔄 Roll Over action
  const handleRollOver = () => {
    if (currentState === "rolling" || currentState === "eating" || currentState === "fetching") return;
    setCurrentState("rolling");
    setMood("Showoff! 🔄");
    showSpeech("Look at me! Woohoo!");
    triggerSparkles(0, 20, 8);
    
    setTimeout(() => {
      if (soundEnabled) playHappyYip();
    }, 600);

    setTimeout(() => {
      setCurrentState("idle");
      setMood("Happy 💖");
    }, 1200);
  };

  // 👋 Shake Paw action
  const handleShakePaw = () => {
    if (currentState === "rolling" || currentState === "eating" || currentState === "fetching") return;
    setCurrentState("shaking");
    setMood("Polite 🤝");
    showSpeech("Nice to meet you! 🐾", 2000);
    
    setTimeout(() => {
      setCurrentState("idle");
      setMood("Happy 💖");
    }, 2200);
  };

  // 🍖 Feed Treat action
  const handleFeedTreat = () => {
    if (currentState === "rolling" || currentState === "eating" || currentState === "fetching" || treat) return;
    
    setCurrentState("feeding");
    setMood("Hungry! 😋");
    showSpeech("Ooh, a treat! 🍖");

    // Spawn treat at top-center of play area
    setTreat({ x: 80, y: -20, type: "bone" });

    // 1. Drop the treat (takes 0.8s)
    setTimeout(() => {
      // 2. Dog moves to eat it (X shift to center)
      setDogScaleX(1);
      setDogX(80); // Move to the treat
      
      setTimeout(() => {
        // Eat the treat
        setTreat(null);
        setMood("Munching! 🍖");
        if (soundEnabled) playMunchSound();
        triggerSparkles(120, 20, 10);
        showSpeech("Chomp! Munch! Yum! 💖", 1500);

        // 3. Return home
        setTimeout(() => {
          setDogX(0);
          setCurrentState("idle");
          setMood("Happy 💖");
        }, 1200);
      }, 600);
    }, 800);
  };

  // 🎾 Play Fetch action
  const handlePlayFetch = () => {
    if (currentState === "rolling" || currentState === "eating" || currentState === "fetching" || treat) return;

    setCurrentState("fetching");
    setMood("Excited! 🎾");
    showSpeech("Ball! Get the ball! 🎾");

    // Spawn tennis ball at the far right
    setTreat({ x: 220, y: -25, type: "ball" });

    // Ball bounces (takes 0.9s)
    setTimeout(() => {
      // Dog runs right to fetch ball
      setDogScaleX(1); // facing right
      setDogX(180);

      setTimeout(() => {
        // Grab the ball in mouth
        setTreat(null);
        setMood("Got it! 🐶");
        showSpeech("Got it! Returning... 🎾");
        
        // Turn around (face left) to return
        setDogScaleX(-1);
        
        setTimeout(() => {
          // Dog runs back to start
          setDogX(0);
          
          setTimeout(() => {
            // Face right again, sit, and yip happily
            setDogScaleX(1);
            if (soundEnabled) playHappyYip();
            triggerSparkles(60, -20, 6);
            showSpeech("Play again? 🐾");
            setCurrentState("idle");
            setMood("Happy 💖");
          }, 600);
        }, 600);
      }, 700);
    }, 900);
  };

  // Petting (hover/move over the dog card)
  const handlePetBuddy = (e) => {
    if (currentState === "sleeping" || currentState === "rolling" || currentState === "fetching") return;
    
    petCountRef.current += 1;
    if (petCountRef.current % 8 === 0) {
      // Play sound and show hearts
      if (soundEnabled) playHappyYip();
      setMood("Loving it! 💕");
      showSpeech("Oh yeah, that's the spot! 🥰", 1800);
      
      // Generate floating hearts
      const id = heartIdCounter.current++;
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeX = e.clientX - rect.left - 50;
      const relativeY = e.clientY - rect.top - 80;
      setHeartList((prevList) => [
        ...prevList,
        { 
          id, 
          x: relativeX, 
          y: relativeY,
          drift: (Math.random() - 0.5) * 50,
          rot: (Math.random() - 0.5) * 30
        }
      ]);
      
      setTimeout(() => {
        setHeartList((prevList) => prevList.filter((h) => h.id !== id));
      }, 1200);
    }

    resetSleepTimeout();
  };

  const handleCompactPointerMove = (e) => {
    if (!compact) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;
    const anchorX = rect.width * 0.82;
    const anchorY = rect.height * 0.82;
    const deltaX = pointerX - anchorX;
    const deltaY = pointerY - anchorY;
    const distance = Math.hypot(deltaX, deltaY);

    setCompactMotion({
      x: clamp(deltaX * 0.18, -20, 12),
      y: clamp(deltaY * 0.14, -14, 10),
      rotate: clamp(deltaX * 0.08, -10, 10),
      scale: distance < 42 ? 1.08 : 1.03,
      flip: 1,
    });

    if (distance < 42) {
      setCompactFace("curious");
    }

    resetSleepTimeout();
  };

  const handleCompactPointerLeave = () => {
    if (!compact) return;

    setCompactMotion({ x: 0, y: 0, rotate: 0, scale: 1, flip: 1 });
    setCompactFace("cute");
    resetSleepTimeout();
  };

  useEffect(() => {
    if (!compact) return undefined;

    let lastScrollY = window.scrollY;
    let resetTimer = null;

    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      const delta = nextScrollY - lastScrollY;
      lastScrollY = nextScrollY;

      const speed = Math.abs(delta);
      if (speed < 4) return;

      const face = speed > 28 ? "goofy" : delta > 0 ? "hyper" : "surprised";
      setCompactFace(face);
      setCompactMotion((prev) => ({
        ...prev,
        x: clamp(prev.x + (delta > 0 ? -2 : 2), -22, 14),
        y: clamp(prev.y + (delta > 0 ? -3 : 2), -16, 12),
        rotate: clamp(prev.rotate + (delta > 0 ? -4 : 4), -12, 12),
        scale: face === "goofy" ? 1.12 : 1.06,
        flip: 1,
      }));

      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        setCompactFace("cute");
        setCompactMotion({ x: 0, y: 0, rotate: 0, scale: 1, flip: 1 });
      }, 420);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [compact]);

  // Formulating Buddy's SVG animations
  const headVariants = {
    idle: { rotate: [0, -1.5, 1.5, 0], transition: { repeat: Infinity, duration: 4.5, ease: "easeInOut" } },
    sleeping: { y: 6, rotate: 4, transition: { duration: 0.8 } },
    barking: { 
      y: [0, -12, 0, -12, 0], 
      rotate: [0, -8, 0, -8, 0],
      transition: { duration: 0.8, ease: "easeInOut" } 
    },
    rolling: { rotate: 360, transition: { duration: 1.2 } },
    shaking: { rotate: [0, 5, -3, 5, 0], transition: { duration: 2 } },
    eating: { y: [0, 10, 0, 10, 0], rotate: [0, 4, -4, 4, 0], transition: { duration: 1.2 } },
    fetching: { y: [0, -5, 0, -5, 0], rotate: [0, 5, 0, 5, 0], transition: { duration: 0.8 } }
  };

  const tailVariants = {
    idle: { rotate: [-10, 20, -10], transition: { repeat: Infinity, duration: 0.9, ease: "easeInOut" } },
    sleeping: { rotate: -15, transition: { duration: 0.8 } },
    barking: { rotate: [-20, 35, -20], transition: { repeat: Infinity, duration: 0.3 } },
    rolling: { rotate: 180, transition: { duration: 1.2 } },
    shaking: { rotate: [-5, 15, -5], transition: { repeat: Infinity, duration: 0.7 } },
    eating: { rotate: [-25, 38, -25], transition: { repeat: Infinity, duration: 0.25 } }, // wag super fast when eating!
    fetching: { rotate: [-20, 30, -20], transition: { repeat: Infinity, duration: 0.4 } }
  };

  const rightPawVariants = {
    idle: { y: 0, rotate: 0 },
    sleeping: { y: 2, rotate: 0 },
    shaking: { 
      y: [0, -18, -12, -18, 0], 
      rotate: [0, -35, -20, -35, 0], 
      transition: { duration: 2.2, times: [0, 0.2, 0.5, 0.8, 1] } 
    },
    rolling: { rotate: 360, transition: { duration: 1.2 } }
  };

  const shellClassName = compact
    ? "relative select-none overflow-visible flex flex-col items-end gap-0"
    : "glass-card relative p-6 bg-white/75 backdrop-blur-xl border border-white/50 shadow-2xl shadow-primary/10 rounded-4xl w-full max-w-87.5 mx-auto overflow-hidden flex flex-col gap-5 select-none";

  const stageClassName = compact
    ? "relative w-full h-[224px] overflow-visible flex items-end justify-end pr-1 pb-1"
    : "relative bg-linear-to-b from-indigo-50/40 to-indigo-100/30 rounded-2xl h-42.5 w-full overflow-hidden flex items-end justify-center border border-slate-100/50";

  const dogClassName = compact
    ? "relative w-56 h-52 z-10 origin-bottom-right flex items-end cursor-pointer pb-0"
    : "relative w-37.5 h-35 z-10 origin-bottom flex items-end cursor-pointer pb-2";

  return (
    <div 
      className={shellClassName}
      onMouseMove={compact ? handleCompactPointerMove : handlePetBuddy}
      onMouseLeave={compact ? handleCompactPointerLeave : undefined}
    >
      {!compact && (
        <>
          {/* Sparkles list overlay */}
          {sparkleList.map((s) => (
            <SparkleParticle key={s.id} x={s.x} y={s.y} driftX={s.driftX} delay={s.delay} />
          ))}

          {/* Floating hearts */}
          {heartList.map((h) => (
            <span
              key={h.id}
              className="absolute text-rose-500 pointer-events-none select-none text-2xl z-30"
              style={{
                left: `${130 + h.x}px`,
                top: `${130 + h.y}px`,
                animation: "floatHeart 1.2s ease-out forwards",
                "--heart-x": `${h.drift}px`,
                "--heart-r": `${h.rot}deg`,
              }}
            >
              ❤️
            </span>
          ))}
        </>
      )}

      {!compact && (
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-slate-950 flex items-center gap-1.5 text-base tracking-tight uppercase">
              Buddy's Playpen <span className="animate-bounce">🐾</span>
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Interactive AI Companion
            </p>
          </div>
          
          {/* Sound & Mood badges */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-lg transition-colors border ${soundEnabled ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
              title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <span className="badge bg-primary/10 text-primary border border-primary/20 font-black text-[10px]">
              {mood}
            </span>
          </div>
        </div>
      )}

      {/* Main Interactive Stage */}
      <div 
        ref={playAreaRef}
        className={stageClassName}
        onMouseMove={compact ? handleCompactPointerMove : undefined}
        onMouseLeave={compact ? handleCompactPointerLeave : undefined}
      >
        {!compact && (
          <AnimatePresence>
            {zzzList.map((z, idx) => (
              <span
                key={z.id}
                className="absolute font-black text-primary/80 pointer-events-none select-none text-sm z-30"
                style={{
                  left: `${175 + dogX}px`,
                  bottom: "105px",
                  animation: "floatZzz 2s ease-out forwards",
                }}
              >
                {"Zzz".substring(0, (idx % 3) + 1)}
              </span>
            ))}
          </AnimatePresence>
        )}

        {!compact && (
          <AnimatePresence>
            {speechBubble && (
              <Motion.div
                initial={{ scale: 0.7, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -5 }}
                className="absolute bg-slate-900/95 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg border border-slate-800 z-40 max-w-37.5 text-center"
                style={{
                  left: `${100 + dogX - 35}px`,
                  bottom: "135px",
                }}
              >
                {speechBubble}
                <div className="absolute w-2 h-2 bg-slate-900 border-r border-b border-slate-800 rotate-45 left-1/2 -translate-x-1/2 -bottom-1" />
              </Motion.div>
            )}
          </AnimatePresence>
        )}

        {!compact && (
          <AnimatePresence>
            {treat && (
              <Motion.div
                initial={{ y: -50, x: treat.x, rotate: 0 }}
                animate={{ 
                  y: 115, 
                  rotate: treat.type === "bone" ? 180 : 360,
                  transition: { type: "spring", damping: 12, stiffness: 90 }
                }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute text-2xl z-20 pointer-events-none"
              >
                {treat.type === "bone" ? "🍖" : "🎾"}
              </Motion.div>
            )}
          </AnimatePresence>
        )}

        {/* The Dog Sprite Container */}
        <Motion.div
          ref={dogRef}
          animate={compact ? {
            x: compactMotion.x,
            y: compactMotion.y,
            rotate: compactMotion.rotate,
            scale: compactMotion.scale,
          } : { x: dogX, scaleX: dogScaleX }}
          transition={{ type: "spring", damping: 20, stiffness: 120 }}
          className={dogClassName}
          onClick={handleBark}
          title="Click to hear Buddy bark!"
          style={{ transformBox: "fill-box" }}
        >
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full"
            style={{ overflow: "visible" }}
          >
            <defs>
              <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="60%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="headGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="earGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <radialGradient id="shadowGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(15, 23, 42, 0.28)" />
                <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
              </radialGradient>
            </defs>

            {/* ── Ground Shadow ── */}
            <ellipse cx="100" cy="180" rx="55" ry="10" fill="url(#shadowGradient)" />

            {/* ── Tail ── */}
            <Motion.path
              d="M 52 142 C 22 135 8 112 14 88"
              stroke="url(#earGradient)"
              strokeWidth="11"
              strokeLinecap="round"
              fill="none"
              variants={tailVariants}
              animate={currentState}
              style={{ transformBox: "fill-box", transformOrigin: "52px 142px" }}
            />

            {/* ── Back Leg ── */}
            <ellipse cx="65" cy="164" rx="15" ry="11" fill="#b45309" />
            <circle cx="60" cy="172" r="7.5" fill="#d97706" />

            {/* ── Body (Golden Retriever) ── */}
            <ellipse cx="98" cy="142" rx="44" ry="27" fill="url(#bodyGradient)" />

            {/* ── Front Left Leg (Far side) ── */}
            <rect x="110" y="142" width="11" height="34" rx="5.5" fill="#b45309" />

            {/* ── Front Right Leg (Near side, animatable) ── */}
            <Motion.g
              variants={rightPawVariants}
              animate={currentState}
              style={{ transformBox: "fill-box", transformOrigin: "135px 142px" }}
            >
              <rect x="128" y="142" width="12" height="34" rx="6" fill="url(#bodyGradient)" />
              {/* Little cute paw pad highlights */}
              <circle cx="134" cy="174" r="2.5" fill="#b45309" />
            </Motion.g>

            {/* ── Neck (Blends Body to Head) ── */}
            <path d="M 115 125 L 138 100 L 122 90 L 96 114 Z" fill="url(#bodyGradient)" />

            {/* ── Red Collar with Gold Medallion ── */}
            <path d="M 112 121 L 132 101" stroke="#ef4444" strokeWidth="6.5" strokeLinecap="round" />
            {/* Golden Tag */}
            <circle cx="122" cy="113" r="5" fill="#f59e0b" />
            <circle cx="122" cy="113" r="2" fill="#fff" />

            {/* ── Head Group (Breathing, bobs, shakes) ── */}
            <Motion.g
              variants={headVariants}
              animate={currentState}
              style={{ transformBox: "fill-box", transformOrigin: "115px 115px" }}
            >
              {/* Head Base */}
              <circle cx="130" cy="78" r="26" fill="url(#headGradient)" />

              {/* Snout */}
              <ellipse cx="147" cy="84" rx="16" ry="11" fill="url(#headGradient)" />

              {/* Nose */}
              <ellipse cx="160" cy="79" rx="5.5" ry="4.5" fill="#0f172a" />
              {/* Nose Highlight */}
              <circle cx="158" cy="77" r="1.2" fill="#ffffff" />

              {/* Mouth & Tongue */}
              {compact && compactFace === "goofy" ? (
                <g>
                  <path d="M 143 89 Q 152 98 156 89 Z" fill="#991b1b" />
                  <ellipse cx="150" cy="92" rx="4.5" ry="5.5" fill="#f43f5e" />
                </g>
              ) : compact && compactFace === "surprised" ? (
                <path d="M 145 87 Q 150 93 155 87 Q 150 98 145 87 Z" fill="#991b1b" />
              ) : currentState === "barking" || currentState === "eating" || mood.includes("Loving") ? (
                // Open Mouth + Happy Tongue
                <g>
                  <path d="M 143 89 Q 152 98 156 89 Z" fill="#991b1b" />
                  <ellipse cx="150" cy="92" rx="4.5" ry="5.5" fill="#f43f5e" />
                </g>
              ) : (
                // Cute Smile Line
                <path d="M 141 85 Q 150 91 155 85" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              )}

              {/* Floppy Ear (bounces) */}
              <Motion.path
                d="M 113 67 C 98 78 98 103 108 111 C 113 103 116 83 115 67 Z"
                fill="url(#earGradient)"
                animate={currentState === "sleeping" ? { rotate: 2 } : { rotate: [0, -3, 3, 0] }}
                transition={currentState === "sleeping" ? { duration: 0.8 } : { repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                style={{ transformBox: "fill-box", transformOrigin: "113px 67px" }}
              />

              {/* Eyebrows */}
              {compact && compactFace === "surprised" ? (
                <>
                  <path d="M 125 59 Q 130 54 135 58" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  <path d="M 144 59 Q 149 54 154 58" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                </>
              ) : (
                <>
                  <path d="M 125 61 Q 130 58 135 62" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  <path d="M 144 61 Q 149 58 154 62" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                </>
              )}

              {/* Eyes */}
              {currentState === "sleeping" ? (
                // Closed Eyes (sleeping)
                <g>
                  <path d="M 127 72 Q 132 77 137 72" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M 144 72 Q 149 77 154 72" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </g>
              ) : compact && compactFace === "goofy" ? (
                <g>
                  <circle cx="132" cy="72" r="8.5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" />
                  <path d="M 142 72 Q 149 76 156 72" stroke="#b45309" strokeWidth="2.6" strokeLinecap="round" fill="none" />
                  <Motion.circle
                    cx="132"
                    cy="72"
                    r="3.6"
                    fill="#1e293b"
                    animate={{ x: -1, y: 1 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  />
                  <Motion.circle
                    cx="150"
                    cy="72"
                    r="4.2"
                    fill="#1e293b"
                    animate={{ x: 0, y: -1 }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
                  />
                </g>
              ) : compact && compactFace === "surprised" ? (
                <g>
                  <circle cx="132" cy="72" r="9" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" />
                  <circle cx="150" cy="72" r="9" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" />
                  <circle cx="132" cy="72" r="3.1" fill="#1e293b" />
                  <circle cx="150" cy="72" r="3.1" fill="#1e293b" />
                  <circle cx="132" cy="69.5" r="1.2" fill="#ffffff" />
                  <circle cx="150" cy="69.5" r="1.2" fill="#ffffff" />
                </g>
              ) : (
                // Big Puppy Eyes
                <g>
                  {/* Left Eye Sclera */}
                  <circle cx="132" cy="72" r="7.5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" />
                  {/* Right Eye Sclera */}
                  <circle cx="150" cy="72" r="7.5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" />

                  {/* Left Pupil (Tracks Cursor) */}
                  <Motion.circle
                    cx="132"
                    cy="72"
                    r="4.5"
                    fill="#1e293b"
                    animate={{ x: pupilOffset.x, y: pupilOffset.y }}
                    transition={{ type: "spring", damping: 15, stiffness: 220 }}
                  />
                  {/* Right Pupil (Tracks Cursor) */}
                  <Motion.circle
                    cx="150"
                    cy="72"
                    r="4.5"
                    fill="#1e293b"
                    animate={{ x: pupilOffset.x, y: pupilOffset.y }}
                    transition={{ type: "spring", damping: 15, stiffness: 220 }}
                  />

                  {/* Pupil Reflections (Cute glints!) */}
                  <circle cx="133.8" cy="70.2" r="1.3" fill="#ffffff" />
                  <circle cx="131" cy="73.8" r="0.6" fill="#ffffff" />
                  
                  <circle cx="151.8" cy="70.2" r="1.3" fill="#ffffff" />
                  <circle cx="149" cy="73.8" r="0.6" fill="#ffffff" />
                </g>
              )}
            </Motion.g>
          </svg>
        </Motion.div>
        
        {!compact && (
          <div className="absolute bottom-0 inset-x-0 h-4 bg-emerald-500/20 border-t border-emerald-500/10 flex items-center justify-center z-0">
            <div className="w-[85%] h-px bg-emerald-500/20" />
          </div>
        )}
      </div>

      {!compact && (
        <>
          {/* Control Buttons: Tricks & Actions */}
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={handleBark}
              disabled={currentState !== "idle" && currentState !== "sleeping"}
              className="flex flex-col items-center justify-center gap-1 p-2 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 active:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Bark"
            >
              <span className="text-base select-none">🗣️</span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Bark</span>
            </button>

            <button
              onClick={handleShakePaw}
              disabled={currentState !== "idle" && currentState !== "sleeping"}
              className="flex flex-col items-center justify-center gap-1 p-2 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 active:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Shake Paw"
            >
              <span className="text-base select-none">👋</span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Paw</span>
            </button>

            <button
              onClick={handleRollOver}
              disabled={currentState !== "idle" && currentState !== "sleeping"}
              className="flex flex-col items-center justify-center gap-1 p-2 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 active:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Roll Over"
            >
              <span className="text-base select-none">🔄</span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Roll</span>
            </button>

            <button
              onClick={handleFeedTreat}
              disabled={(currentState !== "idle" && currentState !== "sleeping") || treat}
              className="flex flex-col items-center justify-center gap-1 p-2 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 active:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Feed Bone"
            >
              <span className="text-base select-none">🍖</span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Feed</span>
            </button>

            <button
              onClick={handlePlayFetch}
              disabled={(currentState !== "idle" && currentState !== "sleeping") || treat}
              className="flex flex-col items-center justify-center gap-1 p-2 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 active:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Play Fetch"
            >
              <span className="text-base select-none">🎾</span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Fetch</span>
            </button>
          </div>

          {/* Playground instructions */}
          <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest leading-none mt-1">
            Hover to Pet • Move Cursor to look around
          </p>
        </>
      )}
    </div>
  );
};

export default InteractiveDog;
