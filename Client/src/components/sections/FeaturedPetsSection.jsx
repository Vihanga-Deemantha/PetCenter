import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { getListings } from "../../api/listing.api";
import { formatCurrency } from "../../utils/priceFormatter";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 16 } },
};

const FeaturedPetsSection = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getListings({ limit: 4, sort: "-createdAt" })
      .then((result) => setPets(result.data || []))
      .catch(() => setPets([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-7 pt-24">
      <div className="flex items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-3">Looking for a home</p>
          <h2 className="font-heading text-[32px] sm:text-[46px] font-medium text-[#292925] tracking-tight">Pets waiting nearby</h2>
        </div>
        <Link to="/marketplace" className="hidden sm:inline text-sm font-medium text-secondary border-b border-[#cfc8ba] pb-0.75 shrink-0">
          Browse all pets
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex flex-col gap-3">
              <div className="aspect-4/3 bg-border rounded-card" />
              <div className="h-5 bg-border w-2/3 rounded-full" />
              <div className="h-4 bg-border/70 w-1/2 rounded-full" />
            </div>
          ))}
        </div>
      ) : pets.length === 0 ? (
        <div className="py-16 text-center bg-white border border-dashed border-[#dcd4c6] rounded-card">
          <p className="text-[#8a8a80] font-medium">No pets listed right now — check back soon.</p>
        </div>
      ) : (
        <Motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {pets.map((pet) => (
            <Motion.article
              key={pet._id}
              variants={itemVariants}
              className="bg-white border border-[#E8E2D8] rounded-card overflow-hidden transition-all duration-400 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/10"
            >
              <Link to={`/marketplace/${pet._id}`}>
                <div className="relative aspect-4/3 overflow-hidden bg-border">
                  <img
                    src={pet.images?.[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800"}
                    alt={pet.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-light/92 text-secondary text-[11px] tracking-wider uppercase px-2.5 py-1.5 rounded-full">
                    {pet.listingType === "adoption" ? "Adoption" : "For sale"}
                  </span>
                </div>
                <div className="px-5 pt-4.5 pb-5.5">
                  <div className="flex items-baseline justify-between gap-2.5">
                    <h3 className="font-heading text-xl font-medium text-[#292925] truncate">{pet.title}</h3>
                    <span className="text-sm text-primary font-semibold shrink-0">
                      {pet.listingType === "adoption" && !pet.price ? "Free" : formatCurrency(pet.price)}
                    </span>
                  </div>
                  <p className="mt-1.5 mb-4 text-[13px] text-[#7a7a70]">{pet.location}</p>
                  <span className="block text-center border border-[#cfc8ba] rounded-full py-2.5 text-[13px] font-medium text-secondary transition-colors hover:bg-accent hover:text-white hover:border-accent">
                    Meet {pet.title.split(" ")[0]}
                  </span>
                </div>
              </Link>
            </Motion.article>
          ))}
        </Motion.div>
      )}
    </section>
  );
};

export default FeaturedPetsSection;
