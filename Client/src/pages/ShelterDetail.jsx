import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Landmark, MapPin, Phone, Mail, Link as LinkIcon, ShieldCheck, AlertCircle, Eye, ArrowLeft, Heart, CheckCircle2 } from "lucide-react";
import { getShelterDetail, revealShelterContact } from "../api/shelter.api";

const ShelterDetail = () => {
  const { id } = useParams();

  const [shelter, setShelter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Scrape-safe contact details reveal
  const [contact, setContact] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await getShelterDetail(id);
      setShelter(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load shelter details.");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleRevealContact = async () => {
    if (contact) return;
    setRevealing(true);
    try {
      const res = await revealShelterContact(id);
      setContact(res.data.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setNeedsAuth(true);
      } else {
        console.error(err);
        setContact({ phone: "Failed to reveal", email: "Failed to reveal" });
      }
    }
    setRevealing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
      </div>
    );
  }

  if (error || !shelter) {
    return (
      <div className="min-h-screen py-16 text-center max-w-lg mx-auto">
        <AlertCircle className="mx-auto mb-4 text-rose-500" size={48} />
        <h2 className="text-2xl font-black text-slate-900 mb-2">Error Loading Shelter</h2>
        <p className="text-slate-500 font-semibold mb-6">{error || "Shelter not found"}</p>
        <Link to="/shelters" className="btn btn-primary bg-slate-900 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl">
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6">
      <Link to="/shelters" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors mb-6">
        <ArrowLeft size={16} /> Directory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left 2 Columns: Shelter Profile Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Card */}
          <div className="glass-card p-8 bg-white/95 border-slate-100 flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-card bg-primary/10 border border-primary/20/50 overflow-hidden flex items-center justify-center shrink-0">
              {shelter.logo?.url ? (
                <img src={shelter.logo.url} alt={shelter.name} className="w-full h-full object-cover" />
              ) : (
                <Landmark className="text-primary" size={36} />
              )}
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                  {shelter.name}
                </h1>
                {shelter.isVerified && (
                  <span className="text-emerald-500 shrink-0" title="Verified Shelter Network">
                    <ShieldCheck size={20} className="fill-current text-emerald-100" />
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3.5 text-xs text-slate-400 font-bold">
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full font-black uppercase tracking-wider">
                  {shelter.type.replace("_", " ")}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="text-slate-300" />
                  {shelter.location.city}, {shelter.location.country}
                </span>
              </div>

              <p className="text-slate-600 font-medium text-sm leading-relaxed border-t border-slate-100 pt-3">
                {shelter.description}
              </p>
            </div>
          </div>

          {/* Active Campaigns by Shelter */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Heart className="text-secondary" size={20} /> Active Campaigns
            </h3>

            {shelter.campaigns?.length === 0 ? (
              <div className="glass-card p-6 text-center text-slate-400 font-semibold bg-white/70">
                This shelter does not have any active fundraising campaigns at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {shelter.campaigns.map((camp) => {
                  const progress = Math.min(100, (camp.raisedAmount / camp.goalAmount) * 100);
                  return (
                    <div key={camp._id} className="glass-card bg-white border border-slate-100 flex flex-col justify-between h-full overflow-hidden">
                      <div className="h-32 bg-slate-100 relative">
                        <img src={camp.images[0]?.url} alt={camp.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-black text-slate-900 text-base mb-1 line-clamp-1">
                            <Link to={`/campaigns/${camp._id}`} className="hover:text-secondary transition-colors">{camp.title}</Link>
                          </h4>
                          <p className="text-slate-400 text-xs font-semibold line-clamp-2 mb-4">
                            {camp.shortDescription}
                          </p>
                        </div>
                        <div>
                          <div className="space-y-1 mb-3">
                            <div className="flex justify-between text-xs font-black">
                              <span className="text-slate-700">${(camp.raisedAmount / 100).toLocaleString()}</span>
                              <span className="text-secondary">{progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-linear-to-r from-secondary to-accent" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                          <Link
                            to={`/campaigns/${camp._id}`}
                            className="btn btn-primary bg-linear-to-r from-secondary to-accent py-2 w-full text-center text-xs font-black uppercase tracking-wider rounded-xl block"
                          >
                            Support Campaign
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Contact & Needs List */}
        <div className="space-y-8">
          {/* Contact Details Card */}
          <div className="glass-card p-6 bg-white border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-1.5">
              Contact Details
            </h3>

            {contact ? (
              <div className="space-y-3.5 text-slate-600 font-semibold text-xs">
                <div className="flex items-center gap-2.5">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span>{contact.phone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a>
                </div>
                {shelter.contact?.website && (
                  <div className="flex items-center gap-2.5">
                    <LinkIcon size={14} className="text-slate-400 shrink-0" />
                    <a
                      href={shelter.contact.website.startsWith("http") ? shelter.contact.website : `https://${shelter.contact.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline line-clamp-1"
                    >
                      {shelter.contact.website}
                    </a>
                  </div>
                )}
              </div>
            ) : needsAuth ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 font-bold">
                  Sign in to view this shelter's phone number and email.
                </p>
                <Link
                  to={`/login?redirect=${encodeURIComponent(`/shelters/${id}`)}`}
                  className="w-full py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  Log In to Reveal Contact
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 font-bold">
                  Contact details are locked to protect against spam scrapers. Click below to verify and unlock details.
                </p>
                <button
                  onClick={handleRevealContact}
                  disabled={revealing}
                  className="w-full py-3 rounded-xl bg-primary/10 hover:bg-primary/10 border border-primary/20/30 text-primary font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {revealing ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      Unlocking...
                    </>
                  ) : (
                    <>
                      <Eye size={14} />
                      Reveal Phone & Email
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Needs List Card */}
          {shelter.needsList?.length > 0 && (
            <div className="glass-card p-6 bg-white border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-1.5">
                Current Needs
              </h3>
              <div className="flex flex-wrap gap-2">
                {shelter.needsList.map((need, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={12} className="text-slate-400" />
                    {need}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShelterDetail;
