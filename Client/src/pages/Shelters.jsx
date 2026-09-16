import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Search, MapPin, Phone, Mail, Link as LinkIcon, ShieldCheck, Landmark, Eye, ArrowRight } from "lucide-react";
import { getShelters, revealShelterContact } from "../api/shelter.api";

const SHELTER_TYPES = [
  { value: "", label: "All types" },
  { value: "shelter", label: "Shelter" },
  { value: "rescue", label: "Rescue" },
  { value: "rehabilitation", label: "Rehab" },
  { value: "vet_clinic", label: "Vet clinic" },
  { value: "foster_network", label: "Foster network" },
];

const STEPS = [
  { n: "01", title: "Apply", desc: "Send your name, location and how many animals you hold." },
  { n: "02", title: "We review", desc: "Our team checks your records before you go live." },
  { n: "03", title: "Go live", desc: "Your listings and campaigns appear on PetCenter." },
  { n: "04", title: "Get supported", desc: "Adoption interest and store orders start flowing your way." },
];

const chipCls = (active) =>
  `inline-flex items-center justify-center whitespace-nowrap rounded-full px-4.5 py-2.5 text-[13px] font-medium border transition-colors ${
    active ? "bg-accent text-white border-accent" : "bg-white text-secondary border-border hover:bg-light"
  }`;

const Shelters = () => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  const [revealedContacts, setRevealedContacts] = useState({});

  const fetchShelters = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 8 };
      if (search) params.search = search;
      if (type) params.type = type;
      const res = await getShelters(params);
      setShelters(res.data.data || []);
      setPagination(res.data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (err) {
      console.error(err);
      setShelters([]);
    }
    setLoading(false);
  }, [page, search, type]);

  useEffect(() => {
    fetchShelters();
  }, [fetchShelters]);

  const handleRevealContact = async (id) => {
    if (revealedContacts[id]?.phone) return;
    setRevealedContacts((prev) => ({ ...prev, [id]: { ...prev[id], loading: true } }));
    try {
      const res = await revealShelterContact(id);
      setRevealedContacts((prev) => ({ ...prev, [id]: { phone: res.data.data.phone, email: res.data.data.email, loading: false } }));
    } catch (err) {
      const needsAuth = err.response?.status === 401;
      if (!needsAuth) console.error(err);
      setRevealedContacts((prev) => ({ ...prev, [id]: { phone: needsAuth ? null : "Failed to reveal", email: needsAuth ? null : "Failed to reveal", needsAuth, loading: false } }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-7 pb-24">
      <section className="border-b border-border">
        <div className="pt-13 pb-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-12 lg:gap-14 items-center">
          <Motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-3.5">Partner shelters</p>
            <h1 className="font-heading text-[38px] sm:text-[52px] font-medium mb-4 tracking-tight leading-[1.06]">
              The people doing
              <br />
              the <span className="italic text-accent">work</span>
            </h1>
            <p className="text-[15px] leading-relaxed text-[#5c5c54]">Shelters that list with us are visited and checked before they go live, and receive a share of every store order.</p>
          </Motion.div>

          <div className="relative hidden lg:block">
            <div className="relative rounded-[26px] overflow-hidden aspect-4/3 bg-border border border-[#dcd4c6] flex items-center justify-center">
              <Landmark size={48} className="text-[#c9c2b3]" />
            </div>
            <div className="absolute -left-6 top-7 bg-light border border-border rounded-2xl px-4.5 py-3.5 shadow-xl shadow-black/10">
              <p className="m-0 text-[11px] tracking-wider uppercase text-accent">Partner network</p>
              <p className="mt-0.75 mb-0 text-sm font-semibold text-[#292925]">{pagination.totalItems || "—"} shelters listed</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-8.5">
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex-1 min-w-70 flex items-center gap-2.5 bg-white border border-border rounded-full px-5 py-3.25">
            <Search size={16} className="text-[#8a8a80] shrink-0" />
            <input
              type="text"
              placeholder="Search by name or city..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full border-none outline-none bg-transparent text-sm text-[#292925] placeholder:text-[#a8a49a]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {SHELTER_TYPES.map((t) => (
              <button key={t.value} onClick={() => { setType(t.value); setPage(1); }} className={chipCls(type === t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-card bg-border animate-pulse h-56" />
            ))}
          </div>
        ) : shelters.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-[#dcd4c6] rounded-card">
            <p className="text-[#8a8a80] font-medium">No shelters match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shelters.map((sh) => (
              <Motion.div key={sh._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#E8E2D8] rounded-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="w-13 h-13 rounded-2xl bg-accent/10 border border-accent/20 overflow-hidden flex items-center justify-center shrink-0">
                      {sh.logo?.url ? <img src={sh.logo.url} alt={sh.name} className="w-full h-full object-cover" /> : <Landmark className="text-accent" size={22} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-heading text-lg font-medium m-0 truncate">
                          <Link to={`/shelters/${sh._id}`} className="hover:text-primary transition-colors">
                            {sh.name}
                          </Link>
                        </h3>
                        {sh.isVerified && <ShieldCheck size={15} className="text-[#40543C] shrink-0" title="Verified shelter" />}
                      </div>
                      <span className="inline-block px-2.5 py-0.5 bg-border text-[#4F5B4B] rounded-full text-[10px] font-semibold uppercase tracking-wider">{sh.type.replace("_", " ")}</span>
                    </div>
                  </div>

                  <p className="text-[#5c5c54] text-[13.5px] leading-relaxed line-clamp-3 mb-4">{sh.description}</p>

                  <div className="flex items-center gap-1.5 text-xs text-[#8a8a80] font-medium mb-4">
                    <MapPin size={13} />
                    <span>
                      {sh.location.city}, {sh.location.country}
                    </span>
                  </div>

                  <div className="border-t border-border pt-4 mt-2 text-xs">
                    {revealedContacts[sh._id]?.phone ? (
                      <div className="space-y-1.75 text-[#3f3f38] font-medium">
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-[#8a8a80]" />
                          <span>{revealedContacts[sh._id].phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={13} className="text-[#8a8a80]" />
                          <a href={`mailto:${revealedContacts[sh._id].email}`} className="text-secondary hover:underline">
                            {revealedContacts[sh._id].email}
                          </a>
                        </div>
                      </div>
                    ) : revealedContacts[sh._id]?.needsAuth ? (
                      <Link to={`/login?redirect=${encodeURIComponent("/shelters")}`} className="px-3.5 py-2 rounded-lg bg-accent/10 border border-accent/20 text-secondary font-semibold text-[11px] uppercase tracking-wider inline-flex items-center gap-1.5">
                        Log in to reveal
                      </Link>
                    ) : (
                      <button onClick={() => handleRevealContact(sh._id)} disabled={revealedContacts[sh._id]?.loading} className="px-3.5 py-2 rounded-lg bg-light border border-border text-secondary font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-60">
                        {revealedContacts[sh._id]?.loading ? (
                          <>
                            <div className="w-3 h-3 rounded-full border border-secondary border-t-transparent animate-spin" /> Revealing...
                          </>
                        ) : (
                          <>
                            <Eye size={12} /> Reveal contact details
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6 border-t border-border pt-4">
                  <Link to={`/shelters/${sh._id}`} className="flex-1 py-2.5 rounded-full bg-secondary text-light hover:bg-[#3d4639] font-semibold text-xs uppercase tracking-wider flex items-center justify-center transition-colors">
                    View profile
                  </Link>
                  {sh.contact?.website && (
                    <a
                      href={sh.contact.website.startsWith("http") ? sh.contact.website : `https://${sh.contact.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-full border border-border text-[#6e6e64] hover:bg-light transition-colors"
                      title="Visit website"
                    >
                      <LinkIcon size={15} />
                    </a>
                  )}
                </div>
              </Motion.div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2.5 mt-11">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`min-w-10 h-10 px-3 rounded-xl text-sm font-medium border transition-colors ${p === pagination.currentPage ? "bg-accent text-white border-accent" : "bg-white text-[#3f3f38] border-border hover:border-accent"}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="mt-20 bg-border border-y border-[#ded6c8] -mx-7 px-7 py-16">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-3">How partnership works</p>
          <h2 className="font-heading text-[32px] sm:text-[42px] font-medium tracking-tight mb-9">Four steps, no fees</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {STEPS.map((s) => (
              <div key={s.n} className="border-t border-[#ccc4b4] pt-5">
                <p className="m-0 font-heading text-[32px] text-secondary">{s.n}</p>
                <h3 className="mt-2.5 mb-2 text-[16px] font-semibold">{s.title}</h3>
                <p className="m-0 text-sm leading-relaxed text-[#3f3f38]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="bg-secondary text-light rounded-[28px] p-11 sm:p-14 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-9 items-center">
          <div>
            <h2 className="font-heading text-[28px] sm:text-[36px] font-medium mb-2.5 tracking-tight">Run a shelter? Apply to partner</h2>
            <p className="m-0 text-base leading-relaxed text-[#DCE0D6] max-w-130">Tell us where you are and how many animals you hold — we reply within a week.</p>
          </div>
          <Link to="/contact" className="btn bg-primary text-white hover:bg-primary-dark px-7.5 py-4 whitespace-nowrap w-fit">
            Get in touch <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Shelters;
