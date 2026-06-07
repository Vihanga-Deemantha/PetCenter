import React, { useState, useEffect, useRef } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Landmark, RefreshCw, AlertCircle, X, Upload, Check, ToggleLeft, ToggleRight } from "lucide-react";
import { getAdminShelters, createShelter, updateShelter, deleteShelter } from "../api/shelter.api";

const SHELTER_TYPES = ["shelter", "rescue", "rehabilitation", "vet_clinic", "foster_network"];

const EMPTY_FORM = {
  name: "", type: "shelter", description: "", city: "", country: "",
  phone: "", email: "", website: "", needsList: "", isVerified: false, isActive: true, logo: null
};

// Shelter Form Modal
const ShelterFormModal = ({ shelter, onSave, onClose }) => {
  const isEdit = !!shelter;
  const [form, setForm] = useState(isEdit ? {
    ...shelter,
    city: shelter.location?.city || "",
    country: shelter.location?.country || "",
    phone: shelter.contact?.phone || "",
    email: shelter.contact?.email || "",
    website: shelter.contact?.website || "",
    needsList: shelter.needsList ? shelter.needsList.join(", ") : "",
    logo: shelter.logo || null
  } : { ...EMPTY_FORM });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [logoPreview, setLogoPreview] = useState(isEdit && shelter.logo?.url ? shelter.logo.url : null);
  
  const fileRef = useRef();
  const logoFile = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      logoFile.current = file;
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.city.trim()) errs.city = "City is required";
    if (!form.country.trim()) errs.country = "Country is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("type", form.type);
      fd.append("description", form.description.trim());
      fd.append("city", form.city.trim());
      fd.append("country", form.country.trim());
      fd.append("phone", form.phone.trim());
      fd.append("email", form.email.trim());
      fd.append("website", form.website.trim());
      fd.append("needsList", form.needsList);
      fd.append("isVerified", form.isVerified);
      fd.append("isActive", form.isActive);

      if (logoFile.current) {
        fd.append("logo", logoFile.current);
      }

      if (isEdit) {
        await updateShelter(shelter._id, fd);
      } else {
        await createShelter(fd);
      }
      onSave();
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || "Failed to save shelter" });
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <Motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[28px] shadow-2xl w-full max-w-xl my-8 border border-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-7 border-b border-slate-100">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
            {isEdit ? "Edit Shelter" : "New Shelter"}
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

          {/* Name */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Shelter/Organization Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white ${errors.name ? "border-rose-400" : "border-slate-200"}`}
              placeholder="e.g. Hope Rescue Sanctuary" />
            {errors.name && <p className="text-xs text-rose-500 font-bold mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Description *</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white resize-none ${errors.description ? "border-rose-400" : "border-slate-200"}`}
              placeholder="Tell us about the shelter's mission..." />
            {errors.description && <p className="text-xs text-rose-500 font-bold mt-1">{errors.description}</p>}
          </div>

          {/* Type + Logo Upload */}
          <div className="grid grid-cols-2 gap-4 items-start">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Shelter Type *</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none capitalize cursor-pointer">
                {SHELTER_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Logo</label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <Landmark size={20} className="text-slate-300" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs uppercase tracking-wider bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Upload Logo
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">City *</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white ${errors.city ? "border-rose-400" : "border-slate-200"}`}
                placeholder="e.g. San Francisco" />
              {errors.city && <p className="text-xs text-rose-500 font-bold mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Country *</label>
              <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white ${errors.country ? "border-rose-400" : "border-slate-200"}`}
                placeholder="e.g. United States" />
              {errors.country && <p className="text-xs text-rose-500 font-bold mt-1">{errors.country}</p>}
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                placeholder="+1 555-0199" />
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                placeholder="contact@shelter.org" />
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Website</label>
              <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                placeholder="www.shelter.org" />
            </div>
          </div>

          {/* Needs List */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Needs List (Comma-separated)</label>
            <input value={form.needsList} onChange={e => setForm({ ...form, needsList: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white"
              placeholder="e.g. Blankets, Dog Food, Cat litter, Medical supplies" />
          </div>

          {/* Verification + Active Flags */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-black text-slate-700 cursor-pointer">
              <input type="checkbox" checked={form.isVerified} onChange={e => setForm({ ...form, isVerified: e.target.checked })}
                className="rounded border-slate-300 text-primary focus:ring-primary" />
              Verified Shelter Status
            </label>
            <label className="flex items-center gap-2 text-xs font-black text-slate-700 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-slate-300 text-primary focus:ring-primary" />
              Active in Directory
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-7 border-t border-slate-100 bg-slate-50/50 rounded-b-[28px]">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider bg-white cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer">
            {saving ? "Saving..." : "Save Shelter"}
          </button>
        </div>
      </Motion.div>
    </div>
  );
};

// Main Admin Shelter Management Component
const AdminShelterManagement = () => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShelter, setEditingShelter] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAdminShelters();
      setShelters(res.data.data || []);
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
    setEditingShelter(null);
    fetchData();
  };

  const handleToggleVerification = async (shelter) => {
    try {
      const fd = new FormData();
      fd.append("isVerified", !shelter.isVerified);
      await updateShelter(shelter._id, fd);
      fetchData();
    } catch (err) {
      alert("Failed to toggle verification");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shelter? This will check linked campaigns first.")) return;
    try {
      await deleteShelter(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete shelter. Check if it is beneficiary of active campaigns.");
    }
  };

  const filtered = shelters.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.location.city.toLowerCase().includes(search.toLowerCase()) ||
    s.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Shelters</h1>
          <p className="text-sm text-slate-400 font-semibold">Manage rescue shelters, update locations, and verify status.</p>
        </div>
        <button
          onClick={() => { setEditingShelter(null); setModalOpen(true); }}
          className="btn btn-primary bg-linear-to-br from-primary to-accent shadow-indigo-500/20 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5 self-start cursor-pointer"
        >
          <Plus size={16} /> New Shelter
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search by name, city, type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
        />
      </div>

      {/* Shelters Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw size={24} className="animate-spin text-slate-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 font-semibold bg-white/50">
          No shelters found. Click "New Shelter" to add one.
        </div>
      ) : (
        <div className="glass-card bg-white border border-slate-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-5">Shelter Profile</th>
                <th className="p-5">Type</th>
                <th className="p-5">Location</th>
                <th className="p-5">Contact Details</th>
                <th className="p-5">Verification</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold text-sm">
              {filtered.map((sh) => (
                <tr key={sh._id} className="hover:bg-slate-50/30">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                        {sh.logo?.url ? (
                          <img src={sh.logo.url} alt={sh.name} className="w-full h-full object-cover" />
                        ) : (
                          <Landmark className="text-slate-300" size={18} />
                        )}
                      </div>
                      <div>
                        <div className="font-black text-slate-900">{sh.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold">Needs: {sh.needsList?.length || 0} items</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 capitalize text-xs text-slate-500 font-bold">{sh.type.replace("_", " ")}</td>
                  <td className="p-5 text-xs text-slate-500 font-bold">{sh.location.city}, {sh.location.country}</td>
                  <td className="p-5 text-xs font-medium space-y-0.5">
                    <div>{sh.contact?.email || "—"}</div>
                    <div className="text-slate-400">{sh.contact?.phone || "—"}</div>
                  </td>
                  <td className="p-5">
                    <button
                      onClick={() => handleToggleVerification(sh)}
                      className="flex items-center gap-1.5 focus:outline-none cursor-pointer"
                      title="Toggle Verification"
                    >
                      {sh.isVerified ? (
                        <ToggleRight className="text-emerald-500" size={32} />
                      ) : (
                        <ToggleLeft className="text-slate-300" size={32} />
                      )}
                      <span className={`text-[10px] font-black uppercase tracking-wider ${sh.isVerified ? "text-emerald-600" : "text-slate-400"}`}>
                        {sh.isVerified ? "Verified" : "Unverified"}
                      </span>
                    </button>
                  </td>
                  <td className="p-5 text-right space-x-1.5">
                    <button
                      onClick={() => { setEditingShelter(sh); setModalOpen(true); }}
                      className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(sh._id)}
                      className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {modalOpen && (
          <ShelterFormModal
            shelter={editingShelter}
            onSave={handleSave}
            onClose={() => { setModalOpen(false); setEditingShelter(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminShelterManagement;
