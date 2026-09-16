import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Landmark, MapPin, Phone, Mail, Link as LinkIcon, ShieldCheck, AlertCircle, Eye, ArrowLeft, Heart, CheckCircle2 } from "lucide-react";
import { getShelterDetail, revealShelterContact } from "../api/shelter.api";
import { formatPrice } from "../utils/priceFormatter";

const ShelterDetail = () => {
  const { id } = useParams();

  const [shelter, setShelter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      if (err.response?.status === 401) setNeedsAuth(true);
      else {
        console.error(err);
        setContact({ phone: "Failed to reveal", email: "Failed to reveal" });
      }
    }
    setRevealing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-9 h-9 rounded-full border-2 border-border border-t-accent animate-spin" />
      </div>
    );
  }

  if (error || !shelter) {
    return (
      <div className="max-w-7xl mx-auto px-7 py-20 text-center max-w-lg">
        <AlertCircle className="mx-auto mb-4 text-[#b4573a]" size={44} />
        <h2 className="font-heading text-2xl mb-2">Error loading shelter</h2>
        <p className="text-[#6e6e64] mb-6">{error || "Shelter not found"}</p>
        <Link to="/shelters" className="btn btn-primary">
          Back to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-7 pt-6 pb-24">
      <Link to="/shelters" className="inline-flex items-center gap-2 text-[13.5px] font-medium text-[#6e6e64] hover:text-primary transition-colors mb-6">
        <ArrowLeft size={16} /> All shelters
      </Link>

      <div className="relative rounded-[26px] overflow-hidden bg-border border border-[#dcd4c6] aspect-32/11 min-h-40">
        <div className="absolute inset-0 bg-secondary/25" />
        <div className="absolute inset-0 bg-linear-to-t from-[#292925]/55 to-transparent" />
        <div className="absolute left-6 sm:left-8 bottom-6 right-6 flex items-end gap-4">
          <span className="w-14 h-14 sm:w-15.5 sm:h-15.5 rounded-full bg-accent text-light flex items-center justify-center font-heading text-2xl shrink-0 border-2 border-light/70">{shelter.name[0]}</span>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              {shelter.isVerified && <span className="bg-light/94 text-[#40543C] text-[11px] font-semibold uppercase tracking-wider px-3.5 py-1.75 rounded-full">Verified shelter</span>}
            </div>
            <h1 className="mt-2.5 font-heading text-[28px] sm:text-[38px] font-medium text-white tracking-tight leading-[1.05] m-0">{shelter.name}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-9 items-start mt-8.5">
        <div className="min-w-0">
          <div className="bg-white border border-border rounded-[24px] p-8">
            <h2 className="font-heading text-xl font-medium mb-4">About the shelter</h2>
            <p className="m-0 text-[#5c5c54] text-[15.5px] leading-relaxed whitespace-pre-wrap">{shelter.description}</p>
            <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-border">
              <span className="px-2.5 py-1 bg-border text-[#4F5B4B] rounded-full text-[11px] font-semibold uppercase tracking-wider">{shelter.type.replace("_", " ")}</span>
              <span className="flex items-center gap-1.5 text-xs text-[#8a8a80] font-medium">
                <MapPin size={13} />
                {shelter.location.city}, {shelter.location.country}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-heading text-xl font-medium mb-5 flex items-center gap-2.5">
              <Heart className="text-primary" size={19} /> Active campaigns
            </h3>
            {shelter.campaigns?.length === 0 ? (
              <div className="bg-white border border-dashed border-[#dcd4c6] rounded-card p-6 text-center text-[#8a8a80]">This shelter has no active campaigns right now.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {shelter.campaigns.map((camp) => {
                  const progress = Math.min(100, (camp.raisedAmount / camp.goalAmount) * 100);
                  return (
                    <div key={camp._id} className="bg-white border border-border rounded-card overflow-hidden flex flex-col">
                      <div className="aspect-16/9 overflow-hidden bg-border">
                        <img src={camp.images[0]?.url} alt={camp.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-5 flex-1 flex flex-col gap-3">
                        <h4 className="font-heading text-lg font-medium m-0 line-clamp-1">
                          <Link to={`/campaigns/${camp._id}`} className="hover:text-secondary transition-colors">
                            {camp.title}
                          </Link>
                        </h4>
                        <p className="m-0 text-[13px] text-[#6e6e64] line-clamp-2 flex-1">{camp.shortDescription}</p>
                        <div>
                          <div className="h-1.5 rounded-full bg-border overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="flex justify-between mt-2 text-xs text-[#6e6e64]">
                            <span>{formatPrice(camp.raisedAmount)}</span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                        </div>
                        <Link to={`/campaigns/${camp._id}`} className="text-center bg-accent text-white rounded-full py-2.5 text-[13px] font-medium hover:bg-secondary transition-colors">
                          Support campaign
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white border border-border rounded-[24px] p-6.5">
            <h3 className="font-semibold text-[#292925] pb-3.5 mb-4 border-b border-border">Contact details</h3>
            {contact ? (
              <div className="space-y-3 text-[#3f3f38] font-medium text-[13px]">
                <div className="flex items-center gap-2.5">
                  <Phone size={14} className="text-[#8a8a80] shrink-0" />
                  <span>{contact.phone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail size={14} className="text-[#8a8a80] shrink-0" />
                  <a href={`mailto:${contact.email}`} className="text-secondary hover:underline">
                    {contact.email}
                  </a>
                </div>
                {shelter.contact?.website && (
                  <div className="flex items-center gap-2.5">
                    <LinkIcon size={14} className="text-[#8a8a80] shrink-0" />
                    <a href={shelter.contact.website.startsWith("http") ? shelter.contact.website : `https://${shelter.contact.website}`} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline line-clamp-1">
                      {shelter.contact.website}
                    </a>
                  </div>
                )}
              </div>
            ) : needsAuth ? (
              <div className="space-y-3">
                <p className="text-xs text-[#8a8a80] font-medium">Sign in to view this shelter's phone number and email.</p>
                <Link to={`/login?redirect=${encodeURIComponent(`/shelters/${id}`)}`} className="w-full py-3 rounded-full bg-accent/10 border border-accent/20 text-secondary font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5">
                  Log in to reveal
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#8a8a80] font-medium">Contact details are hidden to protect against spam. Click to verify and reveal them.</p>
                <button onClick={handleRevealContact} disabled={revealing} className="w-full py-3 rounded-full bg-light border border-border text-secondary font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-60">
                  {revealing ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-secondary border-t-transparent animate-spin" /> Unlocking...
                    </>
                  ) : (
                    <>
                      <Eye size={14} /> Reveal phone &amp; email
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {shelter.needsList?.length > 0 && (
            <div className="bg-border border border-[#ded6c8] rounded-[24px] p-6.5">
              <p className="m-0 mb-3.5 text-[11px] tracking-wider uppercase text-secondary font-semibold">Most needed right now</p>
              <div className="flex flex-wrap gap-2">
                {shelter.needsList.map((need, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-white border border-[#dcd4c6] text-[#3f3f38] rounded-xl text-xs font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-secondary" />
                    {need}
                  </span>
                ))}
              </div>
              <Link to="/products" className="inline-flex items-center gap-2 mt-4 text-[13px] font-medium text-secondary">
                Buy from their wishlist →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShelterDetail;
