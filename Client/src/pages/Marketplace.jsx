import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getListings } from "../api/listing.api";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Plus, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import HeartButton from "../components/ui/HeartButton";

const SPECIES = [
  { value: "", label: "All" },
  { value: "dog", label: "Dogs" },
  { value: "cat", label: "Cats" },
  { value: "bird", label: "Birds" },
  { value: "fish", label: "Fish" },
  { value: "reptile", label: "Reptiles" },
  { value: "other", label: "Other" },
];
const LISTING_TYPES = [
  { value: "", label: "All" },
  { value: "sale", label: "For sale" },
  { value: "adoption", label: "For adoption" },
];
const GENDERS = [
  { value: "", label: "Any" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];
const SORTS = [
  { value: "-createdAt", label: "Recently added" },
  { value: "price", label: "Fee: low to high" },
  { value: "-price", label: "Fee: high to low" },
];
const MAX_FEE = 500;

const chipCls = (active) =>
  `inline-flex items-center justify-center whitespace-nowrap rounded-full px-4.5 py-2.5 text-[13px] font-medium border transition-colors ${
    active ? "bg-accent text-white border-accent" : "bg-white text-secondary border-[#E8E2D8] hover:bg-border"
  }`;

const Marketplace = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    petType: searchParams.get("petType") || "",
    listingType: searchParams.get("listingType") || "",
    gender: searchParams.get("gender") || "",
    location: searchParams.get("location") || "",
    search: searchParams.get("search") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "-createdAt",
    page: Number(searchParams.get("page")) || 1,
  });
  const [searchInput, setSearchInput] = useState(filters.search);
  const [slide, setSlide] = useState(0);
  const slideTimer = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Effects run after the initial mount too, not just on real changes —
      // without the equality check, loading (or refreshing) a deep link like
      // ?page=3 silently snapped back to page 1 ~400ms later even though the
      // user never touched the search box.
      setFilters((f) => (f.search === searchInput ? f : { ...f, search: searchInput, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const data = await getListings(params);
      setPets(data.data);
      setPagination(data.pagination || { total: data.data.length, pages: 1, page: 1 });
      setSlide(0);
    } catch (err) {
      console.error("Failed to fetch listings", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const heroSlides = pets.slice(0, 3);
  useEffect(() => {
    clearInterval(slideTimer.current);
    if (heroSlides.length > 1) {
      slideTimer.current = setInterval(() => setSlide((s) => (s + 1) % heroSlides.length), 5200);
    }
    return () => clearInterval(slideTimer.current);
  }, [heroSlides.length]);

  const clearFilters = () => {
    setFilters({ petType: "", listingType: "", gender: "", location: "", search: "", maxPrice: "", sort: "-createdAt", page: 1 });
    setSearchInput("");
  };

  const hasFilters = Object.entries(filters).some(([k, v]) => !["page", "sort"].includes(k) && Boolean(v));

  return (
    <div className="pb-24">
      {/* Header */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-7 pt-13 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-3.5">Marketplace</p>
            <h1 className="font-heading text-[38px] sm:text-[52px] font-medium mb-4 tracking-tight leading-[1.06]">
              Pets looking for
              <br />a <span className="italic text-accent">steady home</span>
            </h1>
            <p className="text-[15px] leading-relaxed text-[#5c5c54] max-w-130 mb-7">
              Every listing is reviewed before it appears here. Health notes, temperament and fees are shown upfront —{" "}
              <span className="font-semibold text-[#292925]">{pagination.total}</span> pets currently listed.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#list" className="btn bg-accent text-white hover:bg-secondary px-7 py-3.5">
                Browse listings
              </a>
              {user && (
                <Link to="/create-listing" className="btn border border-[#cfc8ba] text-secondary hover:bg-border px-7 py-3.5">
                  <Plus size={17} /> List a pet
                </Link>
              )}
            </div>
          </div>

          <div className="relative hidden sm:block">
            <div className="relative rounded-[26px] overflow-hidden aspect-4/3 bg-border border border-[#dcd4c6]">
              {heroSlides.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-[#8a8a80] text-sm">No pets to preview yet</div>
              ) : (
                heroSlides.map((pet, i) => (
                  <div key={pet._id} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: i === slide ? 1 : 0 }}>
                    <img
                      src={pet.images?.[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000"}
                      alt={pet.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#292925]/42 to-transparent pointer-events-none" />
                    <div className="absolute left-6 bottom-5.5 right-6">
                      <p className="m-0 text-[11px] tracking-wider uppercase text-border">{pet.petType}</p>
                      <p className="mt-1 font-heading text-2xl text-white font-medium">{pet.title}</p>
                    </div>
                  </div>
                ))
              )}
              {heroSlides.length > 1 && (
                <div className="absolute right-6 bottom-5.5 flex gap-1.75 z-10">
                  {heroSlides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlide(i)}
                      aria-label={`Show slide ${i + 1}`}
                      className="h-1.75 rounded-full border-none cursor-pointer transition-all duration-300"
                      style={{ width: i === slide ? 26 : 7, background: i === slide ? "#F7F4ED" : "rgba(247,244,237,.45)" }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="absolute -left-6 top-7 bg-light border border-border rounded-2xl px-4.5 py-3.5 shadow-xl shadow-black/10">
              <p className="m-0 text-[11px] tracking-wider uppercase text-accent">Verified listing</p>
              <p className="mt-0.75 text-sm font-semibold">Records checked by us</p>
            </div>
          </div>
        </div>
      </section>

      {/* Search + species chips */}
      <section className="max-w-7xl mx-auto px-7 pt-6.5">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-70 flex items-center gap-2.5 bg-white border border-border rounded-full px-5 py-3.25">
            <Search size={16} className="text-[#8a8a80] shrink-0" />
            <input
              type="text"
              placeholder="Search by breed, title or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full border-none outline-none bg-transparent text-sm text-[#292925] placeholder:text-[#a8a49a]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {SPECIES.map((s) => (
              <button key={s.value} onClick={() => setFilters((f) => ({ ...f, petType: s.value, page: 1 }))} className={chipCls(filters.petType === s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Listings */}
      <section id="list" className="max-w-7xl mx-auto px-7 pt-8.5 grid grid-cols-1 lg:grid-cols-[248px_1fr] gap-10 items-start">
        <aside className="lg:sticky lg:top-28 flex flex-col gap-7 pb-10">
          <div>
            <p className="m-0 mb-3.5 text-[11px] tracking-wider uppercase text-[#8a8a80] font-semibold">Listing type</p>
            <div className="flex flex-wrap gap-2">
              {LISTING_TYPES.map((t) => (
                <button key={t.value} onClick={() => setFilters((f) => ({ ...f, listingType: t.value, page: 1 }))} className={chipCls(filters.listingType === t.value)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-6">
            <p className="m-0 mb-3.5 text-[11px] tracking-wider uppercase text-[#8a8a80] font-semibold">Gender</p>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map((g) => (
                <button key={g.value} onClick={() => setFilters((f) => ({ ...f, gender: g.value, page: 1 }))} className={chipCls(filters.gender === g.value)}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-6">
            <p className="m-0 mb-3.5 text-[11px] tracking-wider uppercase text-[#8a8a80] font-semibold">Price / fee</p>
            <input
              type="range"
              min="0"
              max={MAX_FEE}
              step="10"
              value={filters.maxPrice || MAX_FEE}
              onChange={(e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) >= MAX_FEE ? "" : e.target.value, page: 1 }))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between mt-2 text-[13px] text-[#6e6e64]">
              <span>0</span>
              <span>Up to {filters.maxPrice && Number(filters.maxPrice) < MAX_FEE ? filters.maxPrice : `${MAX_FEE}+`}</span>
            </div>
          </div>
          <div className="border-t border-border pt-6">
            <p className="m-0 mb-3.5 text-[11px] tracking-wider uppercase text-[#8a8a80] font-semibold">Location</p>
            <div className="relative">
              <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a8a80]" />
              <input
                type="text"
                placeholder="City"
                value={filters.location}
                onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value, page: 1 }))}
                className="w-full pl-9 pr-3.5 py-2.75 rounded-xl border border-border text-sm text-[#292925] bg-white outline-none focus:border-accent"
              />
            </div>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="text-left text-[13px] font-medium text-primary hover:underline">
              Clear all filters
            </button>
          )}
        </aside>

        <div>
          <div className="flex items-center justify-between gap-5 pb-5 border-b border-border mb-7">
            <p className="m-0 text-sm text-[#6e6e64]">
              {pagination.total} {pagination.total === 1 ? "pet available" : "pets available"}
            </p>
            <div className="flex items-center gap-2.5">
              <span className="text-[13px] text-[#8a8a80]">Sort</span>
              <select
                value={filters.sort}
                onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value, page: 1 }))}
                className="border border-border rounded-full px-4 py-2.5 text-[13px] text-[#3f3f38] bg-white outline-none cursor-pointer"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse flex flex-col gap-3">
                  <div className="aspect-square bg-border rounded-card" />
                  <div className="h-5 bg-border w-2/3 rounded-full" />
                  <div className="h-4 bg-border/70 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {pets.map((pet, index) => (
                    <Motion.article
                      layout
                      key={pet._id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className="bg-white border border-[#E8E2D8] rounded-card overflow-hidden flex flex-col transition-all duration-400 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/10"
                    >
                      <div className="relative aspect-square overflow-hidden bg-border">
                        <img
                          src={pet.images?.[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000"}
                          alt={pet.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 left-3 max-w-[calc(100%-56px)] bg-light/94 text-secondary text-[11px] tracking-wider uppercase px-2.5 py-1.5 rounded-full truncate">
                          {pet.status === "active" ? pet.listingType : pet.status}
                        </span>
                        <div className="absolute top-2.5 right-2.5 z-10">
                          <HeartButton itemType="listing" itemId={pet._id} size={15} />
                        </div>
                      </div>

                      <div className="px-5 pt-4.5 pb-5.5 flex-1 flex flex-col gap-3">
                        <div className="flex items-baseline justify-between gap-2.5">
                          <h3 className="font-heading text-[21px] font-medium text-[#292925] m-0">{pet.title}</h3>
                          <span className="text-sm text-primary font-semibold shrink-0">
                            {pet.listingType === "adoption" && !pet.price ? "Free" : `LKR ${pet.price?.toLocaleString()}`}
                          </span>
                        </div>
                        <p className="m-0 text-[13px] text-[#7a7a70]">
                          {pet.breed} · {pet.age} mo · {pet.location}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="bg-[#F2EFE7] border border-border text-secondary text-[11px] px-2.5 py-1 rounded-full capitalize">{pet.gender}</span>
                          <span className="bg-[#F2EFE7] border border-border text-secondary text-[11px] px-2.5 py-1 rounded-full capitalize">{pet.petType}</span>
                        </div>
                        <p className="m-0 text-xs text-[#6e6e64] flex items-center gap-1.5">
                          <span className="w-1.25 h-1.25 rounded-full bg-accent shrink-0" />
                          {pet.owner?.name}
                        </p>
                        <Link
                          to={`/marketplace/${pet._id}`}
                          className="mt-auto text-center border border-[#cfc8ba] rounded-full py-2.5 text-[13px] font-medium text-secondary transition-colors hover:bg-accent hover:text-white hover:border-accent"
                        >
                          View profile
                        </Link>
                      </div>
                    </Motion.article>
                  ))}
                </AnimatePresence>
              </div>

              {pets.length === 0 && (
                <div className="text-center py-20">
                  <h2 className="font-heading text-3xl text-[#292925] mb-2">No pets found</h2>
                  <p className="text-[#6e6e64] mb-7">Try adjusting your search or filters.</p>
                  {hasFilters && (
                    <button onClick={clearFilters} className="btn btn-primary px-7">
                      <X size={16} /> Clear all filters
                    </button>
                  )}
                </div>
              )}

              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2.5 mt-13">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setFilters((f) => ({ ...f, page: p }))}
                      className={`min-w-10 h-10 px-3 rounded-xl text-sm font-medium border transition-all ${
                        p === pagination.page ? "bg-accent text-white border-accent" : "bg-white text-[#3f3f38] border-border hover:border-accent"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-7xl mx-auto px-7 mt-20">
        <div className="bg-secondary text-light rounded-[28px] p-11 sm:p-14 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-9 items-center">
          <div>
            <h2 className="font-heading text-[28px] sm:text-[36px] font-medium mb-2.5 tracking-tight">Can't find the right match yet?</h2>
            <p className="m-0 text-base leading-relaxed text-[#DCE0D6] max-w-130">Every listing here is reviewed before it goes live. If none of these feel right, consider listing what you're looking for instead — or check back soon.</p>
          </div>
          <Link to="/create-listing" className="btn bg-primary text-white hover:bg-primary-dark px-7.5 py-4 whitespace-nowrap w-fit">
            <Plus size={17} /> List a pet
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Marketplace;
