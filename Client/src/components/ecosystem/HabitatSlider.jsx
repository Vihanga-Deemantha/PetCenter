import React, { useState, useEffect, useCallback } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import mouseImg from "../../assets/ecosystem/mouse.jpg";
import amphibianImg from "../../assets/ecosystem/amphibian.jpg";
import reptileImg from "../../assets/ecosystem/reptile.jpg";
import snakeImg from "../../assets/ecosystem/snake.jpg";
import spiderImg from "../../assets/ecosystem/spider.jpg";
import birdImg from "../../assets/ecosystem/bird.jpg";

const SLIDES = [
  { image: mouseImg, label: "Mouse & hamster habitats" },
  { image: amphibianImg, label: "Amphibian paludariums" },
  { image: reptileImg, label: "Reptile terrariums" },
  { image: snakeImg, label: "Snake vivariums" },
  { image: spiderImg, label: "Spider enclosures" },
  { image: birdImg, label: "Bird aviaries" },
];

const AUTO_ADVANCE_MS = 4500;

// Auto-advancing showcase of real builder-inspired habitat setups — sits in
// the EcosystemPicker hero. Pauses on hover so it doesn't fight a reader.
export default function HabitatSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(advance, AUTO_ADVANCE_MS);
    return () => clearInterval(t);
  }, [paused, advance]);

  const slide = SLIDES[index];

  return (
    <div
      className="relative rounded-[26px] overflow-hidden aspect-4/3 bg-border border border-[#dcd4c6]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <Motion.img
          key={slide.image}
          src={slide.image}
          alt={slide.label}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-linear-to-t from-[#292925]/55 via-transparent to-transparent pointer-events-none" />

      <p className="absolute left-5 bottom-5 m-0 text-white font-heading text-lg tracking-tight">
        {slide.label}
      </p>

      <div className="absolute right-5 bottom-5 flex gap-1.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.image}
            onClick={() => setIndex(i)}
            aria-label={`Show ${s.label}`}
            className="p-1"
          >
            <span className={`block h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
