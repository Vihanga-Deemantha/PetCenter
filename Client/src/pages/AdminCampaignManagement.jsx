import React, { useState, useEffect, useRef } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, RefreshCw, AlertCircle, X, Upload, Calendar, Play, Archive } from "lucide-react";
import { getAdminCampaigns, createCampaign, updateCampaign, publishCampaign, closeCampaign, deleteCampaign } from "../api/campaign.api";
import { getAdminShelters } from "../api/shelter.api";

const CATEGORIES = ["medical", "shelter", "food", "rescue", "rehabilitation", "general"];

const EMPTY_FORM = {
  title: "", shortDescription: "", description: "", goalAmount: "",
  category: "medical", deadline: "", beneficiary: "", featuredOrder: "", images: []
};

// Campaign Form Drawer/Modal
const CampaignFormModal = ({ campaign, shelters, onSave, onClose }) => {
  const isEdit = !!campaign;
  const [form, setForm] = useState(isEdit ? {
    ...campaign,
    goalAmount: (campaign.goalAmount / 100).toFixed(2),
    deadline: campaign.deadline ? new Date(campaign.deadline).toISOString().split("T")[0] : "",
    beneficiary: campaign.beneficiary?._id || "",
    featuredOrder: campaign.featuredOrder !== null ? String(campaign.featuredOrder) : "",
    images: campaign.images || []
  } : { ...EMPTY_FORM });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePreviews, setImagePreviews] = useState(
    isEdit ? campaign.images.map(img => ({ url: img.url, publicId: img.publicId })) : []
  );
  const [removedPublicIds, setRemovedPublicIds] = useState([]);
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map(f => ({ url: URL.createObjectURL(f), publicId: null, file: f }));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  // Existing (server-side) images are marked for removal via removeImageIds;
  // newly-staged local files are simply dropped and their blob URL revoked.
  const removeImage = (i) => {
    setImagePreviews((prev) => {
      const target = prev[i];
      if (target.publicId) {
        setRemovedPublicIds((ids) => [...ids, target.publicId]);
      } else {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((_, idx) => idx !== i);
    });
  };

  // Revoke any still-staged local previews if the modal closes without saving
  const imagePreviewsRef = useRef(imagePreviews);
  useEffect(() => {
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);
  useEffect(() => {
    return () => {
      imagePreviewsRef.current.forEach((p) => p.file && URL.revokeObjectURL(p.url));
    };
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.shortDescription.trim()) errs.shortDescription = "Short description is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.goalAmount || isNaN(parseFloat(form.goalAmount))) errs.goalAmount = "Valid goal amount required";
    if (imagePreviews.length === 0) errs.images = "At least one image is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("shortDescription", form.shortDescription.trim());
      fd.append("description", form.description.trim());
      fd.append("category", form.category);
      fd.append("goalAmount", Math.round(parseFloat(form.goalAmount) * 100));
      if (form.deadline) fd.append("deadline", form.deadline);
      if (form.beneficiary) fd.append("beneficiary", form.beneficiary);

      if (form.featuredOrder !== undefined && form.featuredOrder !== "") {
        fd.append("featuredOrder", parseInt(form.featuredOrder));
      } else {
        fd.append("featuredOrder", "");
      }

      imagePreviews.filter((p) => p.file).forEach((p) => fd.append("images", p.file));
      removedPublicIds.forEach((id) => fd.append("removeImageIds", id));

      if (isEdit) {
        await updateCampaign(campaign._id, fd);
      } else {
        await createCampaign(fd);
      }
      onSave();
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || "Failed to save campaign" });
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#292925]/40 backdrop-blur-sm p-4 overflow-y-auto">
      <Motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-light rounded-[26px] shadow-2xl w-full max-w-2xl my-8 border border-[#dcd4c6]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6.5 border-b border-border">
          <h2 className="font-heading text-2xl font-medium text-[#292925]">
            {isEdit ? "Edit campaign" : "Create campaign"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-[#8a8a80] hover:bg-border transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-6.5 space-y-5 max-h-[70vh] overflow-y-auto">
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">
              <AlertCircle size={16} /> {errors.submit}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-2">Campaign title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white ${errors.title ? "border-rose-400" : "border-border focus:border-accent"}`}
              placeholder="Rescue Operation for stray cats" />
            {errors.title && <p className="text-xs text-rose-500 font-medium mt-1">{errors.title}</p>}
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-2">Short description (max 200 chars) *</label>
            <input value={form.shortDescription} onChange={e => setForm({ ...form, shortDescription: e.target.value })}
              maxLength={200}
              className={`w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white ${errors.shortDescription ? "border-rose-400" : "border-border focus:border-accent"}`}
              placeholder="Provide a quick summary for card views..." />
            {errors.shortDescription && <p className="text-xs text-rose-500 font-medium mt-1">{errors.shortDescription}</p>}
          </div>

          {/* Description HTML */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-2">Detailed story description *</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4}
              className={`w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white resize-none ${errors.description ? "border-rose-400" : "border-border focus:border-accent"}`}
              placeholder="Describe the campaign story (HTML allowed)..." />
            {errors.description && <p className="text-xs text-rose-500 font-medium mt-1">{errors.description}</p>}
          </div>

          {/* Goal Amount + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-2">Goal amount (USD) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8a80] font-semibold">$</span>
                <input type="number" step="0.01" min="1" value={form.goalAmount} onChange={e => setForm({ ...form, goalAmount: e.target.value })}
                  disabled={isEdit && campaign.raisedAmount > 0}
                  className={`w-full pl-8 pr-4 py-3 rounded-xl border text-sm outline-none bg-white disabled:bg-light ${errors.goalAmount ? "border-rose-400" : "border-border focus:border-accent"}`}
                  placeholder="e.g. 500.00" />
              </div>
              {errors.goalAmount && <p className="text-xs text-rose-500 font-medium mt-1">{errors.goalAmount}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-2">Category *</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border font-medium text-sm bg-white outline-none focus:border-accent capitalize cursor-pointer">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Beneficiary + Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-2">Beneficiary shelter</label>
              <select value={form.beneficiary} onChange={e => setForm({ ...form, beneficiary: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border font-medium text-sm bg-white outline-none focus:border-accent cursor-pointer">
                <option value="">None / Platform general</option>
                {shelters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-2">Deadline</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8a80]" size={16} />
                <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border focus:border-accent text-sm outline-none bg-white cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Featured Order Slot */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-2">Featured slot (optional, 1-3 = pin to featured)</label>
            <input type="number" min="1" max="10" value={form.featuredOrder} onChange={e => setForm({ ...form, featuredOrder: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border focus:border-accent text-sm outline-none bg-white"
              placeholder="Leave empty or specify priority slot" />
          </div>

          {/* Upload Images */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-2">Campaign images (1-6 images) *</label>
            <div className="grid grid-cols-6 gap-3 mb-3">
              {imagePreviews.map((img, idx) => (
                <div key={img.publicId || img.url} className="aspect-square rounded-xl overflow-hidden border border-border relative group bg-light">
                  <img src={img.url} className="w-full h-full object-cover" alt="preview" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute inset-0 bg-[#292925]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    aria-label="Remove image"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              {imagePreviews.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-[#cfc8ba] hover:border-secondary flex flex-col items-center justify-center text-[#8a8a80] hover:text-secondary transition-all cursor-pointer bg-light/60"
                >
                  <Upload size={18} />
                  <span className="text-[9px] font-semibold mt-1">Upload</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
            {errors.images && <p className="text-xs text-rose-500 font-medium">{errors.images}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6.5 border-t border-border bg-light/60 rounded-b-[26px]">
          <button onClick={onClose} className="px-5 py-2.5 rounded-full border border-border text-secondary font-medium text-sm bg-white cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="px-6 py-2.5 rounded-full bg-secondary text-light font-medium text-sm flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer">
            {saving ? "Saving..." : "Save campaign"}
          </button>
        </div>
      </Motion.div>
    </div>
  );
};

// Main Admin Campaign Management Page
const AdminCampaignManagement = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);

  // Close Reason Prompt
  const [closePromptCampaignId, setClosePromptCampaignId] = useState(null);
  const [closeReason, setCloseReason] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campRes, sheltRes] = await Promise.all([
        getAdminCampaigns(),
        getAdminShelters()
      ]);
      setCampaigns(campRes.data.data || []);
      setShelters(sheltRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = () => {
    setModalOpen(false);
    setEditingCampaign(null);
    fetchData();
  };

  const handlePublish = async (id) => {
    try {
      await publishCampaign(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to publish");
    }
  };

  const handleCloseCampaignSubmit = async () => {
    if (!closeReason.trim()) return;
    try {
      await closeCampaign(closePromptCampaignId, closeReason.trim());
      setClosePromptCampaignId(null);
      setCloseReason("");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to close campaign");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campaign? This runs strict guards on associated donations.")) return;
    try {
      await deleteCampaign(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Deletion failed due to integrity checks.");
    }
  };

  const filtered = campaigns.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-7 border-b border-border">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-2.5">Admin</p>
          <h1 className="font-heading text-[32px] font-medium tracking-tight text-[#292925]">Campaigns</h1>
          <p className="text-sm text-[#8a8a80] mt-1">Manage charitable fundraisers, publish drafts, and track progress.</p>
        </div>
        <button
          onClick={() => { setEditingCampaign(null); setModalOpen(true); }}
          className="btn btn-primary self-start cursor-pointer"
        >
          <Plus size={16} /> New campaign
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8a80]" size={16} />
        <input
          type="text"
          placeholder="Search campaigns..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.75 rounded-xl border border-border bg-white focus:border-accent text-sm outline-none"
        />
      </div>

      {/* Campaigns Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw size={24} className="animate-spin text-[#c9c2b3]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-[22px] p-12 text-center text-[#8a8a80] font-medium">
          No campaigns found. Click "New campaign" to create one.
        </div>
      ) : (
        <div className="bg-white border border-border rounded-[22px] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b border-border bg-light/60 text-[10px] font-semibold uppercase tracking-widest text-[#8a8a80]">
                <th className="p-5">Campaign title</th>
                <th className="p-5">Category</th>
                <th className="p-5">Beneficiary</th>
                <th className="p-5">Goal / Progress</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[#3f3f38] text-sm">
              {filtered.map((camp) => {
                const progress = Math.min(100, (camp.raisedAmount / camp.goalAmount) * 100);
                return (
                  <tr key={camp._id} className="hover:bg-light/40">
                    <td className="p-5">
                      <div className="font-semibold text-[#292925]">{camp.title}</div>
                      {camp.featuredOrder !== null && (
                        <span className="text-[10px] text-secondary font-semibold bg-[#E9EDE4] px-2 py-0.5 rounded-full mt-1 inline-block">
                          Featured slot {camp.featuredOrder}
                        </span>
                      )}
                    </td>
                    <td className="p-5 capitalize">{camp.category}</td>
                    <td className="p-5 text-xs text-[#6e6e64] font-medium">{camp.beneficiary?.name || "Platform general"}</td>
                    <td className="p-5 min-w-44">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>${(camp.raisedAmount / 100).toFixed(0)}</span>
                        <span>${(camp.goalAmount / 100).toFixed(0)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-secondary" style={{ width: `${progress}%` }} />
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`badge ${
                        camp.status === "active" ? "bg-[#E9EDE4] text-[#40543C]" :
                        camp.status === "draft" ? "bg-[#EFEBE2] text-[#6e6e64]" :
                        camp.status === "goal_reached" ? "bg-primary/10 text-primary" :
                        "bg-rose-50 text-rose-600"
                      }`}>
                        {camp.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-5 text-right space-x-1.5">
                      {camp.status === "draft" && (
                        <button
                          onClick={() => handlePublish(camp._id)}
                          className="p-2 rounded-lg bg-[#E9EDE4] text-[#40543C] hover:bg-secondary hover:text-white transition-colors"
                          title="Publish campaign"
                        >
                          <Play size={15} />
                        </button>
                      )}
                      {camp.status === "active" && (
                        <button
                          onClick={() => setClosePromptCampaignId(camp._id)}
                          className="p-2 rounded-lg bg-light text-[#6e6e64] hover:bg-border transition-colors"
                          title="Close campaign"
                        >
                          <Archive size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => { setEditingCampaign(camp); setModalOpen(true); }}
                        className="p-2 rounded-lg bg-light text-[#6e6e64] hover:bg-primary/10 hover:text-primary transition-colors"
                        title="Edit details"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(camp._id)}
                        className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <CampaignFormModal
            campaign={editingCampaign}
            shelters={shelters}
            onSave={handleSave}
            onClose={() => { setModalOpen(false); setEditingCampaign(null); }}
          />
        )}
      </AnimatePresence>

      {/* Close Campaign dialog (with reason input) */}
      <AnimatePresence>
        {closePromptCampaignId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292925]/40 backdrop-blur-sm p-4">
            <Motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6.5 rounded-[26px] border border-border shadow-2xl max-w-md w-full space-y-4"
            >
              <h3 className="font-heading text-xl font-medium text-[#292925]">Close campaign</h3>
              <p className="text-xs text-[#8a8a80] font-medium">
                Please provide a reason to close this campaign. This reason will be visible on the public listing.
              </p>
              <input
                type="text"
                placeholder="e.g. Funding goals met via external checks or expired deadline"
                value={closeReason}
                onChange={e => setCloseReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:border-accent text-sm outline-none"
              />
              <div className="flex gap-2.5 justify-end">
                <button
                  onClick={() => { setClosePromptCampaignId(null); setCloseReason(""); }}
                  className="px-4 py-2 border border-border text-secondary font-medium text-sm rounded-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseCampaignSubmit}
                  disabled={!closeReason.trim()}
                  className="px-5 py-2.5 bg-rose-500 text-white font-medium text-sm rounded-full disabled:opacity-50 cursor-pointer"
                >
                  Confirm close
                </button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCampaignManagement;
