import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Heart, Sparkles, Star, Users, Globe } from "lucide-react";
import heroImage from "../assets/hero.png";

const Home = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="home-page overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-24 flex flex-col items-center text-center bg-[radial-gradient(circle_at_50%_-20%,#e0e7ff,transparent_70%)]">
        <Motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-4xl z-10 px-5"
        >
          <Motion.div variants={item} className="mb-6">
            <span className="badge badge-primary bg-indigo-100 text-indigo-700 px-5 py-2.5 text-sm normal-case">
              <Sparkles size={14} className="mr-2 inline" />
              The Next Gen Pet Marketplace
            </span>
          </Motion.div>

          <Motion.h1 variants={item} className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[1.1] md:leading-[1.05] tracking-tighter mb-8">
            Every Pet Deserves a <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">Premium</span> Home.
          </Motion.h1>

          <Motion.p variants={item} className="text-xl md:text-2xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Experience the world's most trusted digital pet platform. Seamlessly browse, 
            shop, and connect with verified breeders and centers.
          </Motion.p>

          <Motion.div variants={item} className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/marketplace" className="btn btn-primary px-10 py-5 text-lg">
              Explore Marketplace <ArrowRight size={20} />
            </Link>
            <Link to="/register" className="btn bg-white border border-white/30 shadow-glass px-10 py-5 text-lg hover:shadow-xl">
              Join our Community
            </Link>
          </Motion.div>
        </Motion.div>

        {/* Hero Image / Glass Card */}
        <Motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
          className="mt-16 w-full max-w-6xl px-[5%]"
        >
          <div className="glass-card p-3 rounded-[32px]">
            <img 
              src={heroImage} 
              alt="Premium Pet Experience" 
              className="w-full rounded-[24px] block shadow-2xl shadow-indigo-500/10"
            />
          </div>
        </Motion.div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 border-y border-slate-100 bg-white/30">
        <div className="flex justify-center gap-8 md:gap-16 flex-wrap opacity-60">
          <div className="flex items-center gap-2 font-bold text-slate-700"><Users size={20}/> 50k+ Happy Owners</div>
          <div className="flex items-center gap-2 font-bold text-slate-700"><Globe size={20}/> Global Reach</div>
          <div className="flex items-center gap-2 font-bold text-slate-700"><Star size={20}/> 4.9/5 Rating</div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 max-w-7xl mx-auto px-5">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">Why PetCenter?</h2>
          <p className="text-slate-500 text-lg">We combine cutting-edge technology with our love for animals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { 
              icon: <ShieldCheck />, 
              title: "Verified Excellence", 
              desc: "Every listing on our marketplace undergoes a rigorous verification process to ensure animal safety and ethical breeding.",
              color: "text-indigo-600",
              bgColor: "bg-indigo-50"
            },
            { 
              icon: <Heart />, 
              title: "Rescue Integration", 
              desc: "We dedicate 10% of every transaction to local rescue shelters. Helping homeless pets find their forever families.",
              color: "text-rose-600",
              bgColor: "bg-rose-50"
            },
            { 
              icon: <Sparkles />, 
              title: "AI Matching", 
              desc: "Our smart algorithms help you find the perfect pet companion based on your lifestyle, home size, and personality.",
              color: "text-violet-600",
              bgColor: "bg-violet-50"
            }
          ].map((feature, i) => (
            <Motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="glass-card p-10 text-left relative overflow-hidden group"
            >
              <div className={`mb-8 inline-flex p-5 ${feature.bgColor} ${feature.color} rounded-[20px] transition-transform group-hover:scale-110 duration-500`}>
                {React.cloneElement(feature.icon, { size: 36 })}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-5">{feature.title}</h3>
              <p className="text-slate-500 text-lg leading-relaxed">{feature.desc}</p>
            </Motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mb-32 px-5 max-w-7xl mx-auto">
        <div className="glass-card bg-slate-900 p-16 md:p-24 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#6366f133,transparent_40%)]" />
          
          <div className="relative z-10">
            <h2 className="text-white text-4xl md:text-6xl font-black mb-6 leading-tight">
              Ready to find your <br/> new best friend?
            </h2>
            <p className="text-slate-400 text-xl mb-12 max-w-2xl mx-auto">
              Join over 50,000 users and start your journey today with the most premium pet platform.
            </p>
            <Link to="/register" className="btn btn-primary px-12 py-5 text-xl">
              Get Started Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
