import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Search, MapPin, Phone, Mail, Link as LinkIcon, ShieldCheck, Landmark, Compass, HelpCircle, Eye } from "lucide-react";
import { getShelters, revealShelterContact } from "../api/shelter.api";

const SHELTER_TYPES = [
  { value: "", label: "All Types" },
  { value: "shelter", label: "Animal Shelter" },
  { value: "rescue", label: "Rescue Group" },
  { value: "rehabilitation", label: "Rehab Center" },
  { value: "vet_clinic", label: "Vet Clinic" },
  { value: "foster_network", label: "Foster Network" },
];

const Shelters = () => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  // Store revealed contact details dynamically by shelter ID
  // e.g. { [shelterId]: { phone, email, loading } }
  const [revealedContacts, setRevealedContacts] = useState({});

  const fetchShelters = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 8 };
      if (search) params.search = search;
      if (type) params.type = type;
      if (city) params.city = city;

      const res = await getShelters(params);
      setShelters(res.data.data || []);
      setPagination(res.data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (err) {
      console.error(err);
      setShelters([]);
    }
    setLoading(false);
  }, [page, search, type, city]);

  useEffect(() => {
    fetchShelters();
  }, [fetchShelters]);

  const handleRevealContact = async (id) => {
    if (revealedContacts[id]?.phone) return; // Already revealed

    setRevealedContacts(prev => ({
      ...prev,
      [id]: { ...prev[id], loading: true }
    }));

    try {
      const res = await revealShelterContact(id);
      setRevealedContacts(prev => ({
        ...prev,
        [id]: {
          phone: res.data.data.phone,
          email: res.data.data.email,
          loading: false
        }
      }));
    } catch (err) {
      console.error(err);
      setRevealedContacts(prev => ({
        ...prev,
        [id]: {
          phone: "Failed to reveal",
          email: "Failed to reveal",
          loading: false
        }
      }));
    }
  };

  return (
    <div className="min-h-screen py-6">
      {/* Header */}
      <Motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="mb-10"
      >
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest border border-primary/20 mb-4">
          <Landmark size={12} /> Partner Networks
        </span>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900 mb-2">
          Shelter <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">Directory</span>
        </h1>
        <p className="text-slate-500 text-lg font-semibold max-w-2xl">
          Connect with verified shelters, rescue foundations, rehabilitation clinics, and pet caretakers in your local community.
        </p>
      </Motion.div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search shelters by name or keywords..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white font-semibold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        {/* Type Filter */}
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
        >
          {SHELTER_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* City Filter */}
        <input
          type="text"
          placeholder="Filter by City..."
          value={city}
          onChange={(e) => { setCity(e.target.value); setPage(1); }}
          className="px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none"
        />
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-card bg-slate-100 animate-pulse aspect-video" />
          ))}
        </div>
      ) : shelters.length === 0 ? (
        <div className="glass-card text-center py-20 bg-white/70">
          <Compass size={44} className="mx-auto mb-3 text-slate-300 animate-spin" style={{ animationDuration: "12s" }} />
          <h3 className="text-lg font-black text-slate-900 mb-1">No Shelters Found</h3>
          <p className="text-slate-400 text-sm font-semibold">Try modifying your search query or city filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shelters.map((sh) => (
            <Motion.div
              key={sh._id}
              whileHover={{ y: -4 }}
              className="glass-card p-6 bg-white/95 border border-slate-100 flex flex-col justify-between"
            >
              <div>
                {/* Shelter identity block */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20/50 overflow-hidden flex items-center justify-center shrink-0">
                    {sh.logo?.url ? (
                      <img src={sh.logo.url} alt={sh.name} className="w-full h-full object-cover" />
                    ) : (
                      <Landmark className="text-primary" size={24} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="text-lg font-black text-slate-900 leading-tight">
                        <Link to={`/shelters/${sh._id}`} className="hover:text-primary transition-colors">{sh.name}</Link>
                      </h3>
                      {sh.isVerified && (
                        <span className="text-emerald-500 shrink-0" title="Verified Shelter">
                          <ShieldCheck size={16} className="fill-current text-emerald-100" />
                        </span>
                      )}
                    </div>
                    <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-wider">
                      {sh.type.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <p className="text-slate-500 text-xs font-semibold line-clamp-3 mb-4">
                  {sh.description}
                </p>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mb-4">
                  <MapPin size={14} className="text-slate-300" />
                  <span>{sh.location.city}, {sh.location.country}</span>
                </div>

                {/* Scrape-Safe Contact block */}
                <div className="border-t border-slate-100 pt-4 mt-2 space-y-2 text-xs">
                  {revealedContacts[sh._id]?.phone ? (
                    <div className="space-y-1.5 text-slate-600 font-semibold">
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-slate-400" />
                        <span>{revealedContacts[sh._id].phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-slate-400" />
                        <a href={`mailto:${revealedContacts[sh._id].email}`} className="text-primary hover:underline">{revealedContacts[sh._id].email}</a>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRevealContact(sh._id)}
                      disabled={revealedContacts[sh._id]?.loading}
                      className="px-3.5 py-2 rounded-lg bg-primary/10/50 hover:bg-primary/10 border border-primary/20/30 text-primary font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {revealedContacts[sh._id]?.loading ? (
                        <>
                          <div className="w-3 h-3 rounded-full border border-primary border-t-transparent animate-spin" />
                          Revealing...
                        </>
                      ) : (
                        <>
                          <Eye size={12} />
                          Reveal Contact Details
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex gap-3 mt-6 border-t border-slate-100 pt-4">
                <Link
                  to={`/shelters/${sh._id}`}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                >
                  View Profile
                </Link>
                {sh.contact?.website && (
                  <a
                    href={sh.contact.website.startsWith("http") ? sh.contact.website : `https://${sh.contact.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
                    title="Visit Website"
                  >
                    <LinkIcon size={16} />
                  </a>
                )}
              </div>
            </Motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-10">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 font-black text-xs text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Prev
          </button>
          <span className="text-xs font-black text-slate-500">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 font-black text-xs text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Shelters;
