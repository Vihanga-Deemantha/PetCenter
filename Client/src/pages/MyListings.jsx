import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Plus, ImagePlus, X, ArrowLeft, Trash2, Check } from "lucide-react";
import { getMyListings, createListing, updateListing, deleteListing, toggleListingPause } from "../api/listing.api";
import { CURRENCY_CODE, formatCurrency } from "../utils/priceFormatter";

const SPECIES = [
  { value: "dog", label: "Dogs" },
  { value: "cat", label: "Cats" },
  { value: "bird", label: "Birds" },
  { value: "fish", label: "Fish" },
  { value: "snake", label: "Snakes" },
  { value: "spider", label: "Spiders" },
  { value: "turtle", label: "Turtles" },
  { value: "mouse", label: "Mice" },
  { value: "reptile", label: "Reptiles" },
  { value: "amphibian", label: "Amphibians" },
  { value: "other", label: "Other" },
];
const VERIFIED_FLAGS = ["Vaccinated", "Spayed / Neutered", "Microchipped", "Habitat Included", "House-trained"];
const FILTERS = ["All", "Active", "Pending", "Paused", "Sold", "Adopted"];
const STATUS_STYLE = {
  active: { bg: "#E9EDE4", fg: "#40543C", label: "Active" },
  pending: { bg: "#F7E9DF", fg: "#8f4a28", label: "Pending" },
  paused: { bg: "#EFEBE2", fg: "#6e6e64", label: "Paused" },
  sold: { bg: "#E4EAF2", fg: "#31506f", label: "Sold" },
  adopted: { bg: "#E4EAF2", fg: "#31506f", label: "Adopted" },
};

const emptyForm = {
  title: "",
  petType: "dog",
  breed: "",
  age: "",
  gender: "male",
  price: "0",
  location: "",
  description: "",
  healthInfo: "",
  listingType: "sale",
  contactDetails: "",
};

const fieldCls = (hasError) =>
  `border rounded-2xl px-4 py-3.25 text-sm text-[#292925] bg-light outline-none transition-colors ${hasError ? "border-[#d79274]" : "border-border focus:border-accent"}`;

const chipCls = (active) =>
  `rounded-full px-4 py-2.5 text-[13px] font-medium border transition-colors ${active ? "bg-secondary text-light border-secondary" : "bg-white text-[#4F5B4B] border-border hover:bg-light"}`;

const MyListings = () => {
  const location = useLocation();
  const { id: editIdFromRoute } = useParams();
  const navigate = useNavigate();

  const [view, setView] = useState("list");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [toast, setToast] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [pauseLoading, setPauseLoading] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [verifiedFlags, setVerifiedFlags] = useState([]);
  const [photos, setPhotos] = useState([]); // {url, publicId, file?}
  const [removedPublicIds, setRemovedPublicIds] = useState([]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyListings();
      setListings(data.data || []);
    } catch (err) {
      console.error("Failed to fetch listings", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Draft autosave — new listings only, contactDetails deliberately excluded.
  useEffect(() => {
    if (view !== "form" || editingId) return;
    const draft = localStorage.getItem("listingDraft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData((prev) => ({ ...prev, ...parsed.formData }));
        setVerifiedFlags(parsed.verifiedFlags || []);
      } catch {
        /* ignore invalid draft */
      }
    }
  }, [view, editingId]);

  useEffect(() => {
    if (view !== "form" || editingId) return;
    const { contactDetails: _contactDetails, ...draftSafe } = formData;
    localStorage.setItem("listingDraft", JSON.stringify({ formData: draftSafe, verifiedFlags }));
  }, [formData, verifiedFlags, view, editingId]);

  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => {
    return () => photosRef.current.forEach((p) => p.file && URL.revokeObjectURL(p.url));
  }, []);

  const onChange = (e) => setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));
  const toggleFlag = (flag) => setVerifiedFlags((prev) => (prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]));

  const onPhotoAdd = (e) => {
    const files = Array.from(e.target.files);
    const room = 5 - photos.length;
    if (room <= 0) return;
    const accepted = files.slice(0, room);
    setPhotos((prev) => [...prev, ...accepted.map((f) => ({ url: URL.createObjectURL(f), publicId: null, file: f }))]);
    e.target.value = "";
  };

  const onPhotoRemove = (index) => {
    setPhotos((prev) => {
      const target = prev[index];
      if (target.publicId) setRemovedPublicIds((ids) => [...ids, target.publicId]);
      else URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const openNewForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setVerifiedFlags([]);
    setPhotos([]);
    setRemovedPublicIds([]);
    setFormError("");
    setView("form");
  };

  const openEditForm = (listing) => {
    setEditingId(listing._id);
    setFormData({
      title: listing.title || "",
      petType: listing.petType || "dog",
      breed: listing.breed || "",
      age: listing.age ?? "",
      gender: listing.gender || "male",
      price: listing.price ?? "0",
      location: listing.location || "",
      description: listing.description || "",
      healthInfo: listing.healthInfo || "",
      listingType: listing.listingType || "sale",
      contactDetails: listing.contactDetails || "",
    });
    setVerifiedFlags(listing.verifiedFlags || []);
    setPhotos((listing.images || []).map((url, i) => ({ url, publicId: listing.imagePublicIds?.[i] || null })));
    setRemovedPublicIds([]);
    setFormError("");
    setView("form");
  };

  const backToList = () => {
    setView("list");
    setEditingId(null);
    if (location.pathname !== "/my-listings") navigate("/my-listings");
  };

  // Deep-linking: /create-listing and /edit-listing/:id are still real
  // routes (Navbar, Marketplace CTAs, etc. all link to them directly), so
  // this page opens straight into the right form when reached that way.
  useEffect(() => {
    if (location.pathname === "/create-listing") {
      // Navigating here while mid-edit (e.g. clicking "Post Ad" in the
      // Navbar without saving first) must not silently discard the edit.
      if (view === "form" && editingId) {
        if (!window.confirm("Discard your unsaved changes to this listing?")) {
          navigate(`/edit-listing/${editingId}`, { replace: true });
          return;
        }
      }
      openNewForm();
    } else if (editIdFromRoute) {
      // Already editing this exact listing (e.g. we just navigated back
      // here after a cancelled "discard changes" prompt above) — leave the
      // in-progress form alone instead of re-seeding it from the original data.
      if (editingId === editIdFromRoute) return;
      if (loading) return;
      const target = listings.find((l) => l._id === editIdFromRoute);
      if (target) {
        openEditForm(target);
      } else {
        flash("Listing not found.");
        navigate("/my-listings");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, editIdFromRoute, loading]);

  const editingListing = editingId ? listings.find((l) => l._id === editingId) : null;

  const validate = () => {
    if (!formData.title || !formData.breed || !formData.age) return "Please fill out the pet's name, breed and age.";
    if (!formData.location || !formData.contactDetails) return "Please provide a location and contact details.";
    if (formData.listingType === "sale" && (!Number.isFinite(Number(formData.price)) || Number(formData.price) <= 0)) return "Please set a valid price for a sale listing.";
    if (!formData.description || !formData.healthInfo) return "Please add a description and health notes.";
    if (photos.length === 0) return "Please add at least one photo.";
    return "";
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      if (verifiedFlags.length === 0) fd.append("verifiedFlags", "");
      else verifiedFlags.forEach((f) => fd.append("verifiedFlags", f));

      if (editingId) {
        photos.filter((p) => p.file).forEach((p) => fd.append("images", p.file));
        removedPublicIds.forEach((pid) => fd.append("removeImageIds", pid));
        await updateListing(editingId, fd);
        flash("Listing updated.");
      } else {
        photos.forEach((p) => fd.append("images", p.file));
        await createListing(fd);
        localStorage.removeItem("listingDraft");
        flash("Listing submitted for review.");
      }
      backToList();
      fetchListings();
    } catch (err2) {
      setFormError(err2.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePause = async (listing) => {
    if (pauseLoading) return;
    setPauseLoading(listing._id);
    try {
      await toggleListingPause(listing._id);
      flash(listing.status === "active" ? `${listing.title} paused — hidden from the marketplace.` : `${listing.title} is live again.`);
      fetchListings();
    } catch (err) {
      flash(err.response?.data?.message || "Couldn't update the listing.");
    } finally {
      setPauseLoading(null);
    }
  };

  const handleDelete = async (id) => {
    const target = listings.find((l) => l._id === id);
    setDeleteLoading(id);
    setConfirmDeleteId(null);
    try {
      await deleteListing(id);
      setListings((prev) => prev.filter((l) => l._id !== id));
      flash(`${target?.title || "Listing"} removed.`);
      if (editingId === id) backToList();
    } catch (err) {
      flash(err.response?.data?.message || "Failed to remove listing.");
    } finally {
      setDeleteLoading(null);
    }
  };

  const statusOf = (l) => STATUS_STYLE[l.status]?.label || l.status;
  const filtered = filter === "All" ? listings : listings.filter((l) => statusOf(l) === filter);

  const stats = [
    { value: listings.filter((l) => l.status === "active").length, label: "Active" },
    { value: listings.reduce((sum, l) => sum + (l.viewCount || 0), 0), label: "Total views" },
    { value: listings.reduce((sum, l) => sum + (l.savesCount || 0), 0), label: "Saves" },
    { value: listings.reduce((sum, l) => sum + (l.enquiriesCount || 0), 0), label: "Enquiries" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-7 pt-8 pb-24">
      {view === "list" ? (
        <div>
          <div className="flex items-end justify-between gap-6 flex-wrap mb-6.5">
            <div>
              <p className="m-0 mb-3 text-xs tracking-[0.18em] uppercase text-accent font-semibold">Your account</p>
              <h1 className="font-heading text-[34px] sm:text-[44px] font-medium tracking-tight m-0">My listings</h1>
              <p className="mt-2.5 text-[15px] text-[#5c5c54]">Listings are reviewed before they appear in the marketplace, usually within a day.</p>
            </div>
            <button onClick={openNewForm} className="btn btn-primary px-6.5 py-3.5 whitespace-nowrap">
              <Plus size={17} /> List a pet
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
            {stats.map((s) => (
              <div key={s.label} className="bg-white border border-border rounded-2xl px-5.5 py-5">
                <p className="m-0 font-heading text-[26px] font-medium">{s.value}</p>
                <p className="mt-1.5 m-0 text-[11px] tracking-wider uppercase text-[#8a8a7e] font-semibold">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={chipCls(filter === f)}>
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-30 bg-border rounded-[20px] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-border rounded-[20px] py-13 px-8 text-center">
              <p className="font-heading text-[22px] font-medium m-0 mb-1.5">Nothing here</p>
              <p className="m-0 text-[#6e6e64]">{listings.length === 0 ? "You haven't posted any listings yet." : "No listings with that status."}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              <AnimatePresence>
                {filtered.map((l) => {
                  const style = STATUS_STYLE[l.status] || { bg: "#EFEBE2", fg: "#6e6e64", label: l.status };
                  const canToggle = l.status === "active" || l.status === "paused";
                  return (
                    <Motion.div
                      key={l._id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-white border border-[#E8E2D8] rounded-[20px] p-4.5 grid grid-cols-1 sm:grid-cols-[110px_1fr_auto] gap-5 items-center"
                    >
                      <div className="w-full h-27.5 sm:w-27.5 rounded-2xl overflow-hidden bg-light shrink-0">
                        <img src={l.images?.[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400"} alt={l.title} className="w-full h-full object-cover" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <p className="m-0 font-heading text-xl font-medium">{l.title}</p>
                          <span className="text-[11px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full whitespace-nowrap" style={{ background: style.bg, color: style.fg }}>
                            {style.label}
                          </span>
                        </div>
                        <p className="mt-1.5 m-0 text-[13px] text-[#6e6e64]">
                          {l.breed} · {l.age} mo · {l.location} · {l.listingType === "adoption" && !l.price ? "Free" : formatCurrency(l.price)}
                        </p>
                        <div className="flex gap-5 flex-wrap mt-3">
                          {[
                            { value: l.viewCount || 0, label: "Views" },
                            { value: l.savesCount || 0, label: "Saves" },
                            { value: l.enquiriesCount || 0, label: "Enquiries" },
                          ].map((m) => (
                            <div key={m.label}>
                              <p className="m-0 text-[15px] font-semibold">{m.value}</p>
                              <p className="mt-0.5 m-0 text-[11px] tracking-wider uppercase text-[#8a8a7e] font-semibold">{m.label}</p>
                            </div>
                          ))}
                        </div>
                        {l.status === "pending" && (
                          <p className="mt-3 mb-0 text-[13px] leading-relaxed text-[#8f4a28] bg-[#F7E9DF] rounded-xl px-3.5 py-2.5">
                            Waiting on review — we check listings before they appear in the marketplace.
                          </p>
                        )}
                      </div>

                      <div className="flex sm:flex-col gap-2.25 shrink-0">
                        <button onClick={() => openEditForm(l)} className="border border-[#cfc8ba] text-secondary rounded-full px-5 py-2.5 text-[13px] font-medium hover:bg-light transition-colors whitespace-nowrap">
                          Edit listing
                        </button>
                        <Link to={`/marketplace/${l._id}`} className="text-center border border-border text-[#6e6e64] rounded-full px-5 py-2.5 text-[13px] font-medium hover:bg-light transition-colors whitespace-nowrap">
                          Preview
                        </Link>
                        {canToggle && (
                          <button onClick={() => handleTogglePause(l)} disabled={pauseLoading === l._id} className="text-[12.5px] text-[#8a8a7e] hover:text-primary transition-colors px-1 whitespace-nowrap disabled:opacity-50">
                            {pauseLoading === l._id ? "Updating…" : l.status === "active" ? "Pause listing" : "Make live"}
                          </button>
                        )}
                      </div>
                    </Motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      ) : (
        <div>
          <button onClick={backToList} className="inline-flex items-center gap-2 text-[13.5px] font-medium text-[#6e6e64] hover:text-primary transition-colors mb-5">
            <ArrowLeft size={16} /> My listings
          </button>

          <h1 className="font-heading text-[30px] sm:text-[38px] font-medium tracking-tight mb-2">{editingId ? "Edit listing" : "List a pet"}</h1>
          <p className="text-[15px] text-[#5c5c54] mb-7 max-w-160">
            {editingId
              ? "Update your listing's details, photos or verified status."
              : "Be specific and honest — listings with detailed temperament notes get more genuine enquiries."}
          </p>

          {formError && (
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#F7E9DF] text-[#8f4a28] rounded-xl px-4 py-3.5 text-sm font-medium mb-5">
              {formError}
            </Motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6.5 items-start">
            <div className="min-w-0 flex flex-col gap-4">
              <div className="bg-white border border-[#E8E2D8] rounded-[22px] p-7">
                <h2 className="font-heading text-xl font-medium mb-5">The basics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                  <label className="flex flex-col gap-1.75 text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e]">
                    Pet name
                    <input name="title" value={formData.title} onChange={onChange} placeholder="Hazel" className={fieldCls(false)} />
                  </label>
                  <label className="flex flex-col gap-1.75 text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e]">
                    Breed
                    <input name="breed" value={formData.breed} onChange={onChange} placeholder="Beagle" className={fieldCls(false)} />
                  </label>
                  <label className="flex flex-col gap-1.75 text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e]">
                    Age in months
                    <input type="number" name="age" min="0" value={formData.age} onChange={onChange} placeholder="7" className={fieldCls(false)} />
                  </label>
                  <label className="flex flex-col gap-1.75 text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e]">
                    Gender
                    <select name="gender" value={formData.gender} onChange={onChange} className={`${fieldCls(false)} cursor-pointer`}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.75 text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e]">
                    Location
                    <input name="location" value={formData.location} onChange={onChange} placeholder="Colombo" className={fieldCls(false)} />
                  </label>
                  <label className="flex flex-col gap-1.75 text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e]">
                    Contact (phone or email)
                    <input name="contactDetails" value={formData.contactDetails} onChange={onChange} placeholder="For inquiries" className={fieldCls(false)} />
                  </label>
                </div>

                <p className="mt-5 mb-2.5 text-[11px] tracking-wider uppercase text-[#8a8a7e] font-semibold">Species</p>
                <div className="flex flex-wrap gap-2">
                  {SPECIES.map((s) => (
                    <button key={s.value} type="button" onClick={() => setFormData((f) => ({ ...f, petType: s.value }))} className={chipCls(formData.petType === s.value)}>
                      {s.label}
                    </button>
                  ))}
                </div>

                <p className="mt-5.5 mb-2.5 text-[11px] tracking-wider uppercase text-[#8a8a7e] font-semibold">Listing type</p>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { key: "sale", label: "For sale", note: "Set your own price" },
                    { key: "adoption", label: "For adoption", note: "Free, or a small rehoming fee" },
                  ].map((t) => {
                    const on = formData.listingType === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setFormData((f) => ({ ...f, listingType: t.key }))}
                        className="flex-1 min-w-45 text-left rounded-2xl px-4.5 py-4 border transition-colors"
                        style={{ borderColor: on ? "#78866F" : "#EDE7DC", background: on ? "#F2EFE7" : "#F7F4ED" }}
                      >
                        <span className="flex items-center gap-2.75">
                          <span className="w-4.5 h-4.5 rounded-full border-[1.5px] shrink-0" style={{ borderColor: on ? "#78866F" : "#cfc8ba", background: on ? "#78866F" : "transparent" }} />
                          <span>
                            <span className="block text-[14.5px] font-semibold text-[#292925]">{t.label}</span>
                            <span className="block text-[12.5px] text-[#6e6e64] mt-0.5">{t.note}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {formData.listingType === "sale" && (
                  <label className="flex flex-col gap-1.75 text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e] mt-4.5 max-w-60">
                    Price ({CURRENCY_CODE})
                    <input type="number" name="price" min="0.01" step="0.01" value={formData.price} onChange={onChange} className={fieldCls(false)} />
                  </label>
                )}
              </div>

              <div className="bg-white border border-[#E8E2D8] rounded-[22px] p-7">
                <h2 className="font-heading text-xl font-medium mb-1.5">Photos</h2>
                <p className="text-[13.5px] text-[#6e6e64] mb-4.5">Up to 5 photos in daylight. The first one is the cover.</p>
                <div className="flex flex-wrap gap-3">
                  {photos.map((photo, i) => (
                    <div key={photo.publicId || photo.url} className="w-24 h-24 rounded-2xl overflow-hidden border border-border relative group">
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => onPhotoRemove(i)} className="absolute inset-0 bg-[#292925]/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <button type="button" onClick={() => fileRef.current?.click()} className="w-24 h-24 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-[#8a8a7e] hover:border-accent hover:text-accent transition-colors">
                      <ImagePlus size={18} />
                      <span className="text-[10px] font-semibold">Add</span>
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={onPhotoAdd} className="hidden" />
              </div>

              <div className="bg-white border border-[#E8E2D8] rounded-[22px] p-7">
                <h2 className="font-heading text-xl font-medium mb-5">Description and health</h2>
                <label className="flex flex-col gap-1.75 text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e] mb-4.5">
                  About this pet
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={onChange}
                    rows={6}
                    placeholder="Temperament, routine, what kind of home suits them, why they are being rehomed."
                    className={`${fieldCls(false)} resize-y font-normal normal-case tracking-normal text-[14px] leading-relaxed`}
                  />
                </label>
                <label className="flex flex-col gap-1.75 text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e]">
                  Health notes
                  <textarea
                    name="healthInfo"
                    value={formData.healthInfo}
                    onChange={onChange}
                    rows={4}
                    placeholder="Vaccinations, neutering, microchip, known conditions, current medication."
                    className={`${fieldCls(false)} resize-y font-normal normal-case tracking-normal text-[14px] leading-relaxed`}
                  />
                </label>

                <p className="mt-5 mb-2.5 text-[11px] tracking-wider uppercase text-[#8a8a7e] font-semibold">Verified status</p>
                <div className="flex flex-wrap gap-2">
                  {VERIFIED_FLAGS.map((flag) => {
                    const on = verifiedFlags.includes(flag);
                    return (
                      <button
                        key={flag}
                        type="button"
                        onClick={() => toggleFlag(flag)}
                        className="rounded-full px-4 py-2.5 text-[13px] font-medium border transition-colors"
                        style={{ borderColor: on ? "#a8b79c" : "#E0D9CC", background: on ? "#E9EDE4" : "#F7F4ED", color: on ? "#40543C" : "#6e6e64" }}
                      >
                        {flag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-28 flex flex-col gap-3.5">
              <div className="bg-white border border-[#E8E2D8] rounded-[22px] p-6.5">
                <p className="m-0 mb-4 text-[11px] tracking-[0.14em] uppercase text-accent font-semibold">Before you submit</p>
                <div className="flex flex-col gap-2.5">
                  {[
                    { label: "Name, breed, age, location and contact filled in", ok: !!(formData.title && formData.breed && formData.age && formData.location && formData.contactDetails) },
                    { label: "A description added", ok: formData.description.trim().length > 0 },
                    { label: "At least one photo", ok: photos.length > 0 },
                    { label: "Health notes added", ok: formData.healthInfo.trim().length > 0 },
                  ].map((c) => (
                    <div key={c.label} className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: c.ok ? "#E9EDE4" : "transparent", border: c.ok ? "none" : "1.5px solid #cfc8ba" }}>
                        {c.ok && <Check size={11} className="text-[#40543C]" strokeWidth={3} />}
                      </span>
                      <p className="m-0 text-[13.5px] leading-snug" style={{ color: c.ok ? "#3f3f38" : "#8a8a7e" }}>
                        {c.label}
                      </p>
                    </div>
                  ))}
                </div>
                <button onClick={onSubmit} disabled={submitting} className="btn btn-primary w-full py-3.5 mt-5">
                  {submitting ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : editingId ? "Save changes" : "Submit for review"}
                </button>
                <p className="mt-3 mb-0 text-xs text-[#8a8a7e] text-center">{editingId ? "Changes go back through review if you alter the species or health notes." : "Reviewed within one working day. Draft saved automatically."}</p>
              </div>

              <div className="bg-border border border-[#ded6c8] rounded-[22px] p-6.5">
                <p className="m-0 mb-2.5 text-[11px] tracking-wider uppercase text-secondary font-semibold">Our approach</p>
                <p className="m-0 text-[13.5px] leading-relaxed text-[#40543C]">Be honest about age and health — it means fewer failed adoptions. Contact details stay hidden until someone asks to see them.</p>
              </div>

              {editingListing && (
                <div className="bg-white border border-[#E8E2D8] rounded-[22px] p-6.5">
                  <p className="m-0 mb-3 text-[11px] tracking-wider uppercase text-accent font-semibold">This listing</p>
                  <div className="flex flex-col gap-2.25">
                    {[
                      { label: "Created", value: new Date(editingListing.createdAt).toLocaleDateString() },
                      { label: "Last edited", value: new Date(editingListing.updatedAt).toLocaleDateString() },
                      { label: "Views", value: editingListing.viewCount || 0 },
                      { label: "Enquiries", value: editingListing.enquiriesCount || 0 },
                    ].map((m) => (
                      <div key={m.label} className="flex justify-between gap-3 text-[13.5px] text-[#3f3f38]">
                        <span>{m.label}</span>
                        <span className="font-semibold">{m.value}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setConfirmDeleteId(editingId)} className="w-full mt-4 border border-[#E0D9CC] text-[#8a8a7e] hover:text-primary rounded-full px-5 py-3 text-[13.5px] transition-colors">
                    Remove this listing
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {confirmDeleteId && (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#292925]/35 backdrop-blur-sm p-4">
            <Motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[26px] shadow-2xl max-w-sm w-full p-8 border border-border">
              <div className="w-14 h-14 bg-[#F7E9DF] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Trash2 size={24} className="text-[#8f4a28]" />
              </div>
              <h2 className="font-heading text-2xl text-center mb-2">Remove listing?</h2>
              <p className="text-[#6e6e64] text-center mb-7">This removes it from the marketplace. This can't be undone.</p>
              <div className="flex gap-3.5">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3.5 bg-light text-[#4F5B4B] rounded-full font-medium hover:bg-border transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={deleteLoading === confirmDeleteId}
                  className="flex-1 py-3.5 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors"
                >
                  {deleteLoading === confirmDeleteId ? "Removing…" : "Yes, remove"}
                </button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

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

export default MyListings;
