import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getListing, getListings, revealListingContact } from "../api/listing.api";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, ArrowLeft, Info, ShieldCheck, ShieldAlert } from "lucide-react";
import HeartButton from "../components/ui/HeartButton";

const STATUS_LABEL = { active: "Active listing", pending: "Pending review", sold: "Sold", adopted: "Adopted", removed: "Removed" };

const ListingDetails = () => {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [toast, setToast] = useState("");
  const [similar, setSimilar] = useState([]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const handleReveal = async (silent = false) => {
    if (!user) {
      return navigate(`/login?redirect=${encodeURIComponent(`/marketplace/${id}`)}`);
    }
    if (contact || revealing) return;
    setRevealing(true);
    try {
      const res = await revealListingContact(id);
      setContact(res.data);
      if (!silent) flash("Contact details revealed.");
    } catch {
      setContact({ contactDetails: "Failed to reveal" });
    } finally {
      setRevealing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    // Without this, navigating from one listing to another (e.g. via a
    // "Similar pets" card, which doesn't unmount this component) kept the
    // previous listing's revealed contact info, selected photo index, and
    // similar-pets list on screen under the new listing's data.
    setPet(null);
    setActiveImg(0);
    setContact(null);
    setSimilar([]);
    getListing(id)
      .then((data) => setPet(data.data))
      .catch(() => setPet(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Owners get their own listing's contact revealed automatically — no
  // point making someone click "reveal" on their own ad.
  useEffect(() => {
    if (user && pet && pet.owner?._id === user._id && !contact && !revealing) {
      handleReveal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pet]);

  useEffect(() => {
    if (!pet) return;
    getListings({ petType: pet.petType, limit: 5 })
      .then((data) => setSimilar((data.data || []).filter((p) => p._id !== pet._id).slice(0, 4)))
      .catch(() => setSimilar([]));
  }, [pet]);

  if (loading)
    return (
      <div className="text-center py-40">
        <Motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );

  if (!pet)
    return (
      <div className="text-center py-40">
        <Info size={40} className="text-[#c9c2b3] mx-auto mb-4" />
        <h2 className="font-heading text-2xl text-[#292925]">Listing not found</h2>
        <Link to="/marketplace" className="btn btn-primary mt-6">
          Back to marketplace
        </Link>
      </div>
    );

  const displayImages = pet.images?.length > 0 ? pet.images : ["https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000"];
  const isActive = pet.status === "active";

  return (
    <div className="max-w-7xl mx-auto px-7 pt-6 pb-20">
      <Link to="/marketplace" className="inline-flex items-center gap-2 text-[13.5px] font-medium text-[#6e6e64] hover:text-primary transition-colors mb-6 group">
        <ArrowLeft size={17} className="transition-transform group-hover:-translate-x-1" /> Back to marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1.62fr_1fr] gap-9 items-start">
        {/* Main */}
        <div className="min-w-0">
          <div className="relative rounded-[26px] overflow-hidden bg-border border border-[#dcd4c6] aspect-16/11">
            <img src={displayImages[activeImg]} alt={pet.title} className="w-full h-full object-cover" />
            <span className={`absolute left-5 top-5 inline-flex items-center gap-1.75 text-[11.5px] font-semibold tracking-wider uppercase px-3.5 py-2 rounded-full ${isActive ? "bg-light/94 text-[#40543C]" : "bg-light/94 text-[#8f4a28]"}`}>
              <span className={`w-1.75 h-1.75 rounded-full ${isActive ? "bg-[#40543C]" : "bg-[#8f4a28]"}`} />
              {STATUS_LABEL[pet.status] || pet.status}
            </span>
            <div className="absolute right-4.5 top-4.5">
              <HeartButton itemType="listing" itemId={pet._id} size={19} />
            </div>
          </div>

          {displayImages.length > 1 && (
            <div className="flex gap-3 mt-3.5 overflow-x-auto pb-1">
              {displayImages.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`shrink-0 w-19 h-19 rounded-2xl overflow-hidden border-2 transition-all ${i === activeImg ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-9.5">
            <p className="m-0 mb-3 text-xs tracking-[0.18em] uppercase text-accent font-semibold">
              {pet.breed} · {pet.location}
            </p>
            <h1 className="font-heading text-[38px] sm:text-[50px] font-medium mb-4.5 tracking-tight leading-[1.05]">{pet.title}</h1>
            <div className="flex flex-wrap gap-2.5">
              {[pet.breed, `${pet.age} months`, pet.gender, pet.petType].map((tag) => (
                <span key={tag} className="bg-border border border-[#ded6c8] text-[#40543C] text-[12.5px] font-medium px-4 py-2.25 rounded-full capitalize">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8.5 bg-white border border-[#E8E2D8] rounded-[24px] p-8">
            <h2 className="m-0 mb-3.5 font-heading text-[23px] font-medium">About {pet.title}</h2>
            <p className="m-0 text-[15.5px] leading-relaxed text-[#5c5c54] whitespace-pre-wrap">{pet.description}</p>

            <div className="h-px bg-[#F0ECE3] my-7" />

            <h2 className="m-0 mb-3.5 font-heading text-[23px] font-medium flex items-center gap-2.5">
              <ShieldCheck size={22} className="text-accent" /> Health &amp; wellness
            </h2>
            <p className="m-0 text-[15.5px] leading-relaxed text-[#5c5c54] whitespace-pre-wrap">{pet.healthInfo}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-28 flex flex-col gap-4">
          <div className="bg-white border border-[#E8E2D8] rounded-[24px] p-7">
            <div className="flex items-baseline justify-between gap-3.5">
              <div>
                <p className="m-0 text-[11px] tracking-wider uppercase text-accent font-semibold">{pet.listingType === "adoption" ? "Adoption fee" : "Price"}</p>
                <p className="mt-1.5 font-heading text-[34px] font-medium tracking-tight">{pet.listingType === "adoption" && !pet.price ? "Free" : `LKR ${pet.price?.toLocaleString()}`}</p>
              </div>
              <span className={`text-[11px] font-semibold tracking-wider uppercase px-3.5 py-2 rounded-full whitespace-nowrap ${pet.listingType === "sale" ? "bg-[#E9EDE4] text-[#40543C]" : "bg-[#F7E9DF] text-[#8f4a28]"}`}>
                For {pet.listingType}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-6">
              {[
                { label: "Species", val: pet.petType },
                { label: "Age", val: `${pet.age} mo` },
                { label: "Location", val: pet.location },
                { label: "Gender", val: pet.gender },
              ].map((d) => (
                <div key={d.label} className="bg-light border border-[#EDE7DC] rounded-2xl p-3.5">
                  <p className="m-0 text-[10.5px] tracking-wider uppercase text-[#8a8a7e] font-semibold">{d.label}</p>
                  <p className="mt-1.25 text-sm font-semibold text-[#292925] capitalize">{d.val}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              {contact ? (
                <a href={`tel:${contact.contactDetails}`} className="btn btn-primary w-full py-3.75 mb-2.5">
                  <Phone size={18} /> {contact.contactDetails}
                </a>
              ) : (
                <button onClick={() => handleReveal(false)} disabled={revealing} className="btn btn-primary w-full py-3.75 mb-2.5">
                  <Phone size={18} /> {revealing ? "Revealing…" : "Reveal contact details"}
                </button>
              )}
              <p className="text-center text-[11px] text-[#8a8a80] font-medium flex items-center justify-center gap-1.5">
                <ShieldAlert size={12} /> Always verify before making payment
              </p>
            </div>
          </div>

          <div className="bg-border border border-[#ded6c8] rounded-[24px] p-6.5">
            <p className="m-0 mb-3.5 text-[11px] tracking-wider uppercase text-secondary font-semibold">Listed by</p>
            <div className="flex items-center gap-3.25">
              <span className="w-11.5 h-11.5 rounded-full bg-accent text-light flex items-center justify-center font-heading text-lg shrink-0 overflow-hidden">
                {pet.owner?.profileImage ? <img src={pet.owner.profileImage} alt="" className="w-full h-full object-cover" /> : pet.owner?.name?.[0]?.toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="m-0 text-[15px] font-semibold text-[#292925] truncate">{pet.owner?.name}</p>
                <p className="mt-0.75 text-[12.5px] text-[#5c5c54] flex items-center gap-1">
                  <MapPin size={11} /> {pet.owner?.location || pet.location}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E8E2D8] rounded-[24px] p-6.5">
            <p className="m-0 mb-3 text-[11px] tracking-wider uppercase text-accent font-semibold">Before you reach out</p>
            <div className="flex flex-col gap-2.75">
              {["Ask for recent health/vaccination records.", "Arrange to meet in a safe, public place first.", "Never send payment before seeing the pet in person."].map((tip, i) => (
                <div key={i} className="flex gap-2.75 items-start">
                  <span className="w-5.25 h-5.25 rounded-full bg-[#F2EFE7] text-secondary text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.25">{i + 1}</span>
                  <p className="m-0 text-[13.5px] leading-relaxed text-[#5c5c54]">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <div className="mt-16">
          <div className="flex items-end justify-between gap-5 flex-wrap mb-5.5">
            <h2 className="m-0 font-heading text-[28px] font-medium tracking-tight">Similar pets nearby</h2>
            <Link to="/marketplace" className="text-sm font-medium text-secondary">
              See all listings
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
            {similar.map((sp) => (
              <Link key={sp._id} to={`/marketplace/${sp._id}`} className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden flex flex-col hover:border-primary transition-colors">
                <div className="aspect-4/3 overflow-hidden bg-border">
                  <img src={sp.images?.[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800"} alt={sp.title} className="w-full h-full object-cover" />
                </div>
                <div className="px-4.5 pt-4 pb-4.5">
                  <div className="flex items-baseline justify-between gap-2.5">
                    <p className="m-0 font-heading text-[19px] font-medium text-[#292925]">{sp.title}</p>
                    <p className="m-0 text-[13.5px] font-semibold text-primary whitespace-nowrap">{sp.listingType === "adoption" && !sp.price ? "Free" : `LKR ${sp.price?.toLocaleString()}`}</p>
                  </div>
                  <p className="mt-1.25 text-xs text-[#6e6e64]">
                    {sp.breed} · {sp.location}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <Motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed left-1/2 bottom-7 -translate-x-1/2 z-120 bg-[#292925] text-light text-[13.5px] px-5.5 py-3.25 rounded-full shadow-xl"
          >
            {toast}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ListingDetails;
