import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  PawPrint,
  Heart,
  Shield,
  Users,
  Star,
  ShoppingBag,
  Leaf,
  ArrowRight,
  CheckCircle,
  Globe,
  Zap,
  MessageSquare,
} from "lucide-react";
import { getPublicStats } from "../api/admin.api";

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 80, damping: 18 },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

// ─── Helper ───────────────────────────────────────────────────────────────────
const formatCount = (n) => {
  if (!n && n !== 0) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k+`;
  return `${n}+`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatPill = ({ icon, value, label }) => (
  <Motion.div
    variants={fadeUp}
    className="flex flex-col items-center gap-3 p-8 bg-white/10 border border-white/15 rounded-3xl backdrop-blur-sm hover:bg-white/15 transition-colors"
  >
    <div className="p-3 bg-white/15 rounded-2xl">{icon}</div>
    <span className="text-4xl font-black text-white tracking-tighter">
      {value}
    </span>
    <span className="text-xs font-black uppercase tracking-widest text-white/60 text-center">
      {label}
    </span>
  </Motion.div>
);

const ValueCard = ({ icon, title, description }) => (
  <Motion.div
    variants={fadeUp}
    className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
  >
    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3">
      {title}
    </h3>
    <p className="text-slate-500 font-medium leading-relaxed text-sm">
      {description}
    </p>
  </Motion.div>
);

const PrincipleRow = ({ number, title, description }) => (
  <Motion.li
    variants={fadeUp}
    className="flex gap-6 items-start py-8 border-b border-slate-100 last:border-0"
  >
    <span className="text-5xl font-black text-slate-200 leading-none select-none shrink-0 w-12 text-center">
      {number}
    </span>
    <div>
      <h4 className="text-lg font-black text-slate-900 tracking-tight mb-1">
        {title}
      </h4>
      <p className="text-slate-500 font-medium leading-relaxed text-sm">
        {description}
      </p>
    </div>
  </Motion.li>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const About = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    getPublicStats()
      .then((res) => setStats(res.data.data))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative py-40 overflow-hidden bg-slate-50 text-slate-900">
        {/* Gradient blobs */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(99, 102, 241, 0.15), transparent), radial-gradient(ellipse 60% 60% at 80% 40%, rgba(139, 92, 246, 0.15), transparent)",
          }}
        />
        <div className="absolute inset-0 bg-slate-50/50" />

        <div className="relative z-10 max-w-5xl mx-auto px-[5%] text-center">
          <Motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center gap-8"
          >
            <Motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-black uppercase tracking-widest text-primary backdrop-blur-md">
                <PawPrint size={14} className="animate-pulse" /> Our Story
              </span>
            </Motion.div>

            <Motion.h1
              variants={fadeUp}
              className="text-5xl md:text-7xl font-black leading-[1.08] tracking-tighter"
            >
              A better world,{" "}
              <span
                className="inline-block px-2 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent italic"
                style={{ paddingTop: "0.1em", paddingBottom: "0.1em" }}
              >
                for every pet.
              </span>
            </Motion.h1>

            <Motion.p
              variants={fadeUp}
              className="text-xl text-slate-500 max-w-2xl leading-relaxed font-medium"
            >
              PetCenter was born from a simple belief: that pets deserve
              a world built around their needs — safe, thoughtful, and full of
              care. We're building that world together.
            </Motion.p>

            <Motion.div variants={fadeUp} className="flex gap-4 mt-4">
              <Link
                to="/marketplace"
                id="about-cta-marketplace"
                className="btn btn-primary px-8 py-4 rounded-2xl flex items-center gap-2 group"
              >
                Browse Marketplace
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <Link
                to="/products"
                id="about-cta-store"
                className="btn bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-2xl hover:border-primary hover:text-primary transition-all shadow-sm"
              >
                Visit Store
              </Link>
            </Motion.div>
          </Motion.div>
        </div>
      </section>

      {/* ── Live Stats Strip ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-primary via-indigo-600 to-accent py-20">
        <div className="max-w-6xl mx-auto px-[5%]">
          <Motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            <StatPill
              icon={<Users size={22} className="text-white" />}
              value={formatCount(stats?.totalUsers)}
              label="Community Members"
            />
            <StatPill
              icon={<PawPrint size={22} className="text-white" />}
              value={formatCount(stats?.totalListings)}
              label="Active Pet Listings"
            />
            <StatPill
              icon={<ShoppingBag size={22} className="text-white" />}
              value={formatCount(stats?.totalOrders)}
              label="Orders Fulfilled"
            />
            <StatPill
              icon={<Star size={22} className="text-white" />}
              value={
                stats?.averageRating ? `${stats.averageRating}/5` : "—"
              }
              label="Average Rating"
            />
          </Motion.div>
        </div>
      </section>

      {/* ── Mission & Story ───────────────────────────────────────────────── */}
      <section className="py-32 bg-white">
        <div className="max-w-6xl mx-auto px-[5%]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <Motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="flex flex-col gap-8"
            >
              <Motion.div variants={fadeUp}>
                <span className="text-primary font-black uppercase tracking-widest text-xs mb-4 block">
                  Our Mission
                </span>
                <h2 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter leading-tight">
                  We're rewriting what it means to care for a pet.
                </h2>
              </Motion.div>
              <Motion.p
                variants={fadeUp}
                className="text-slate-500 font-medium leading-relaxed text-lg"
              >
                PetCenter started with a frustrated aquarium owner who couldn't
                find a trustworthy, end-to-end platform for anything exotic.
                Today, we serve an entire community of passionate pet owners —
                connecting people with the animals, supplies, ecosystems, and
                campaigns that make their world richer.
              </Motion.p>
              <Motion.p
                variants={fadeUp}
                className="text-slate-500 font-medium leading-relaxed"
              >
                Our platform isn't just a marketplace. It's a living ecosystem
                — built for breeders, shelters, hobbyists, first-time owners,
                and everyone in between. Every feature exists to make the bond
                between humans and pets stronger, safer, and more joyful.
              </Motion.p>
              <Motion.div variants={fadeUp} className="flex flex-col gap-3">
                {[
                  "Verified sellers and transparent listings",
                  "Curated premium pet supplies with real reviews",
                  "Custom ecosystem builder for exotic habitats",
                  "Community-driven rescue campaigns",
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle
                      size={18}
                      className="text-emerald-500 mt-0.5 shrink-0"
                    />
                    <span className="text-slate-700 font-medium text-sm">
                      {point}
                    </span>
                  </div>
                ))}
              </Motion.div>
            </Motion.div>

            {/* Visual Block */}
            <Motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 60, damping: 20 }}
              className="relative"
            >
              <div className="aspect-square rounded-[36px] bg-gradient-to-br from-indigo-50 via-teal-50 to-indigo-100 flex items-center justify-center overflow-hidden border border-primary/20 shadow-xl">
                <div className="grid grid-cols-2 gap-6 p-12">
                  {[
                    { emoji: "🐕", label: "Dogs" },
                    { emoji: "🐈", label: "Cats" },
                    { emoji: "🦜", label: "Birds" },
                    { emoji: "🐠", label: "Fish" },
                    { emoji: "🦎", label: "Reptiles" },
                    { emoji: "🐇", label: "Rabbits" },
                  ].map(({ emoji, label }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-2 p-5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                    >
                      <span className="text-4xl">{emoji}</span>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl border border-slate-100 px-6 py-4 flex items-center gap-3">
                <Heart size={20} className="text-rose-500 fill-rose-500" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Our Promise
                  </p>
                  <p className="font-black text-slate-900 text-sm">
                    Every pet matters
                  </p>
                </div>
              </div>
            </Motion.div>
          </div>
        </div>
      </section>

      {/* ── Core Values ───────────────────────────────────────────────────── */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-6xl mx-auto px-[5%]">
          <Motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="flex flex-col gap-16"
          >
            <Motion.div variants={fadeUp} className="max-w-2xl">
              <span className="text-primary font-black uppercase tracking-widest text-xs mb-4 block">
                What We Stand For
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter leading-tight">
                Our core values aren't just words.
              </h2>
            </Motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ValueCard
                icon={<Shield size={26} className="text-primary" />}
                title="Safety First"
                description="Every seller is verified. Every listing is reviewed. We maintain strict community standards so that every interaction on PetCenter is trustworthy."
              />
              <ValueCard
                icon={<Heart size={26} className="text-rose-500" />}
                title="Genuine Care"
                description="We're not just a platform — we're advocates. From rescue campaigns to adoption listings, we actively support the well-being of animals in need."
              />
              <ValueCard
                icon={<Globe size={26} className="text-accent" />}
                title="Inclusive Community"
                description="Whether you have a goldfish or a bearded dragon, a puppy or a boa constrictor — PetCenter is built for every kind of pet owner, everywhere."
              />
            </div>
          </Motion.div>
        </div>
      </section>

      {/* ── Principles ────────────────────────────────────────────────────── */}
      <section className="py-32 bg-white">
        <div className="max-w-6xl mx-auto px-[5%]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 80 }}
            >
              <span className="text-primary font-black uppercase tracking-widest text-xs mb-4 block">
                How We Build
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter leading-tight mb-6">
                The principles behind every decision.
              </h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                Every feature, every policy, every interaction on PetCenter is
                guided by a clear set of principles. This is what separates us
                from a generic marketplace.
              </p>
            </Motion.div>

            <Motion.ul
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <PrincipleRow
                number="01"
                title="Transparency above all"
                description="Real photos, honest descriptions, verified health records — we mandate transparency at every listing stage."
              />
              <PrincipleRow
                number="02"
                title="Premium but accessible"
                description="We curate quality without gatekeeping. Our store ranges from everyday essentials to rare specialty equipment."
              />
              <PrincipleRow
                number="03"
                title="Community-powered trust"
                description="Real buyer reviews, verified seller badges, and community-flagging keep the platform honest and safe."
              />
              <PrincipleRow
                number="04"
                title="Technology that serves life"
                description="From the ecosystem builder to smart recommendations, our tech is designed to serve real pet-care outcomes."
              />
            </Motion.ul>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="py-32 bg-slate-50 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 70% at 30% 50%, rgba(99, 102, 241, 0.1), transparent), radial-gradient(ellipse 50% 60% at 75% 30%, rgba(139, 92, 246, 0.1), transparent)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-[5%] text-center">
          <Motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="flex flex-col items-center gap-10"
          >
            <Motion.div
              variants={fadeUp}
              className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30"
            >
              <Zap size={36} className="text-white" />
            </Motion.div>

            <Motion.h2
              variants={fadeUp}
              className="text-4xl md:text-6xl font-black text-slate-950 tracking-tighter leading-tight"
            >
              Ready to join the community?
            </Motion.h2>

            <Motion.p
              variants={fadeUp}
              className="text-xl text-slate-500 font-medium max-w-xl"
            >
              Browse thousands of pets, shop premium supplies, support rescue
              missions, and design breathtaking ecosystems.
            </Motion.p>

            <Motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                to="/marketplace"
                id="about-bottom-cta-marketplace"
                className="btn btn-primary px-10 py-5 text-lg rounded-2xl flex items-center gap-3 group"
              >
                Browse Pets
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <Link
                to="/products"
                id="about-bottom-cta-store"
                className="btn bg-white border border-slate-200 text-slate-700 px-10 py-5 text-lg rounded-2xl hover:border-primary hover:text-primary transition-all shadow-sm flex items-center gap-2"
              >
                <ShoppingBag size={20} /> Shop Store
              </Link>
            </Motion.div>

            {/* Contact */}
            <Motion.div
              variants={fadeUp}
              className="flex items-center gap-2 text-slate-500 text-sm font-medium"
            >
              <MessageSquare size={14} />
              <span>
                Questions?{" "}
                <a
                  href="mailto:hello@petcenter.lk"
                  className="text-primary hover:text-accent font-bold transition-colors"
                >
                  hello@petcenter.lk
                </a>
              </span>
            </Motion.div>
          </Motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
