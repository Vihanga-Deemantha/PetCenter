import React, { useState, useEffect, useRef } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Heart, RefreshCw, AlertCircle, X, Upload, Calendar, Landmark, Eye, Play, Archive } from "lucide-react";
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
  const fileRef = useRef();
  const newFiles = useRef([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    newFiles.current = [...newFiles.current, ...files];
    const previews = files.map(f => ({ url: URL.createObjectURL(f), publicId: null }));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.shortDescription.trim()) errs.shortDescription = "Short description is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.goalAmount || isNaN(parseFloat(form.goalAmount))) errs.goalAmount = "Valid goal amount required";
    if (!isEdit && newFiles.current.length === 0) errs.images = "At least one image is required";
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

      newFiles.current.forEach(f => fd.append("images", f));

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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <Motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[28px] shadow-2xl w-full max-w-2xl my-8 border border-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-7 border-b border-slate-100">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
            {isEdit ? "Edit Campaign" : "Create Campaign"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-7 space-y-5 max-h-[70vh] overflow-y-auto">
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold border border-rose-100">
              <AlertCircle size={16} /> {errors.submit}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Campaign Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm focus:ring-2 focus:ring-secondary/20 outline-none bg-white ${errors.title ? "border-rose-400" : "border-slate-200"}`}
              placeholder="Rescue Operation for stray cats" />
            {errors.title && <p className="text-xs text-rose-500 font-bold mt-1">{errors.title}</p>}
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Short Description (Max 200 chars) *</label>
            <input value={form.shortDescription} onChange={e => setForm({ ...form, shortDescription: e.target.value })}
              maxLength={200}
              className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm focus:ring-2 focus:ring-secondary/20 outline-none bg-white ${errors.shortDescription ? "border-rose-400" : "border-slate-200"}`}
              placeholder="Provide a quick summary for card views..." />
            {errors.shortDescription && <p className="text-xs text-rose-500 font-bold mt-1">{errors.shortDescription}</p>}
          </div>

          {/* Description HTML */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Detailed Story description *</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4}
              className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm focus:ring-2 focus:ring-secondary/20 outline-none bg-white resize-none ${errors.description ? "border-rose-400" : "border-slate-200"}`}
              placeholder="Describe the campaign story (HTML allowed)..." />
            {errors.description && <p className="text-xs text-rose-500 font-bold mt-1">{errors.description}</p>}
          </div>

          {/* Goal Amount + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Goal Amount (USD) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                <input type="number" step="0.01" min="1" value={form.goalAmount} onChange={e => setForm({ ...form, goalAmount: e.target.value })}
                  disabled={isEdit && campaign.raisedAmount > 0}
                  className={`w-full pl-8 pr-4 py-3 rounded-xl border font-semibold text-sm focus:ring-2 focus:ring-secondary/20 outline-none bg-white disabled:bg-slate-50 ${errors.goalAmount ? "border-rose-400" : "border-slate-200"}`}
                  placeholder="e.g. 500.00" />
              </div>
              {errors.goalAmount && <p className="text-xs text-rose-500 font-bold mt-1">{errors.goalAmount}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Category *</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm bg-white focus:ring-2 focus:ring-secondary/20 outline-none capitalize cursor-pointer">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Beneficiary + Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Beneficiary Shelter</label>
              <select value={form.beneficiary} onChange={e => setForm({ ...form, beneficiary: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm bg-white focus:ring-2 focus:ring-secondary/20 outline-none cursor-pointer">
                <option value="">None / Platform General</option>
                {shelters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Deadline</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 font-semibold text-sm focus:ring-2 focus:ring-secondary/20 outline-none bg-white cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Featured Order Slot */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Featured slot (Optional, 1-3 = Pin to featured)</label>
            <input type="number" min="1" max="10" value={form.featuredOrder} onChange={e => setForm({ ...form, featuredOrder: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold text-sm focus:ring-2 focus:ring-secondary/20 outline-none bg-white"
              placeholder="Leave empty or specify priority slot" />
          </div>

          {/* Upload Images */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Campaign Images (1-6 images) *</label>
            <div className="grid grid-cols-6 gap-3 mb-3">
              {imagePreviews.map((img, idx) => (
                <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-slate-200 relative group bg-slate-50">
                  <img src={img.url} className="w-full h-full object-cover" alt="preview" />
                </div>
              ))}
              {imagePreviews.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-secondary flex flex-col items-center justify-center text-slate-400 hover:text-secondary transition-all cursor-pointer bg-slate-50/50"
                >
                  <Upload size={18} />
                  <span className="text-[9px] font-bold mt-1">Upload</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
            {errors.images && <p className="text-xs text-rose-500 font-bold">{errors.images}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-7 border-t border-slate-100 bg-slate-50/50 rounded-b-[28px]">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider bg-white cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer">
            {saving ? "Saving..." : "Save Campaign"}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Campaigns</h1>
          <p className="text-sm text-slate-400 font-semibold">Manage charitable fundraisers, publish drafts, and track progress.</p>
        </div>
        <button
          onClick={() => { setEditingCampaign(null); setModalOpen(true); }}
          className="btn btn-primary bg-gradient-to-br from-secondary to-accent shadow-rose-500/20 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5 self-start cursor-pointer"
        >
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search campaigns..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-sm focus:ring-2 focus:ring-secondary/20 outline-none"
        />
      </div>

      {/* Campaigns Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw size={24} className="animate-spin text-slate-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 font-semibold bg-white/50">
          No campaigns found. Click "New Campaign" to create one.
        </div>
      ) : (
        <div className="glass-card bg-white border border-slate-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-5">Campaign Title</th>
                <th className="p-5">Category</th>
                <th className="p-5">Beneficiary</th>
                <th className="p-5">Goal / Progress</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold text-sm">
              {filtered.map((camp) => {
                const progress = Math.min(100, (camp.raisedAmount / camp.goalAmount) * 100);
                return (
                  <tr key={camp._id} className="hover:bg-slate-50/30">
                    <td className="p-5">
                      <div className="font-black text-slate-900">{camp.title}</div>
                      {camp.featuredOrder !== null && (
                        <span className="text-[10px] text-secondary font-black bg-rose-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                          Featured Slot {camp.featuredOrder}
                        </span>
                      )}
                    </td>
                    <td className="p-5 capitalize">{camp.category}</td>
                    <td className="p-5 text-xs text-slate-500 font-bold">{camp.beneficiary?.name || "Platform General"}</td>
                    <td className="p-5 min-w-44">
                      <div className="flex justify-between text-xs font-black mb-1">
                        <span>${(camp.raisedAmount / 100).toFixed(0)}</span>
                        <span>${(camp.goalAmount / 100).toFixed(0)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-secondary" style={{ width: `${progress}%` }} />
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`badge ${
                        camp.status === "active" ? "bg-emerald-50 text-emerald-600" :
                        camp.status === "draft" ? "bg-slate-100 text-slate-500" :
                        camp.status === "goal_reached" ? "bg-indigo-50 text-indigo-600" :
                        "bg-rose-50 text-rose-600"
                      }`}>
                        {camp.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-5 text-right space-x-1.5">
                      {camp.status === "draft" && (
                        <button
                          onClick={() => handlePublish(camp._id)}
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          title="Publish Campaign"
                        >
                          <Play size={15} />
                        </button>
                      )}
                      {camp.status === "active" && (
                        <button
                          onClick={() => setClosePromptCampaignId(camp._id)}
                          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                          title="Close Campaign"
                        >
                          <Archive size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => { setEditingCampaign(camp); setModalOpen(true); }}
                        className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Edit Details"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <Motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-7 rounded-[24px] border border-slate-100 shadow-2xl max-w-md w-full space-y-4"
            >
              <h3 className="text-lg font-black text-slate-900">Close Campaign</h3>
              <p className="text-xs text-slate-400 font-bold">
                Please provide a reason to close this campaign. This reason will be visible on the public listing.
              </p>
              <input 
                type="text" 
                placeholder="e.g. Funding goals met via external checks or expired deadline"
                value={closeReason}
                onChange={e => setCloseReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-semibold text-sm focus:ring-2 focus:ring-secondary/20 outline-none"
              />
              <div className="flex gap-2.5 justify-end">
                <button 
                  onClick={() => { setClosePromptCampaignId(null); setCloseReason(""); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs uppercase rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCloseCampaignSubmit}
                  disabled={!closeReason.trim()}
                  className="px-5 py-2.5 bg-rose-500 text-white font-black text-xs uppercase rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  Confirm Close
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
