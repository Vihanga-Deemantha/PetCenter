import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { updateProfile as updateProfileApi, uploadProfilePhoto } from "../api/auth.api.js";
import { motion as Motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Edit3, Save, CheckCircle, Camera, AlertCircle } from "lucide-react";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    location: user?.location || "",
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await updateProfileApi(formData);
      updateUser(res.data);
      setEditing(false);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("profileImage", file);
      const res = await uploadProfilePhoto(fd);
      updateUser(res.data);
      setSuccess("Photo updated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Photo upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!user) return (
    <div className="text-center py-40">
      <Motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="inline-block"
      >
        <User size={48} className="text-primary/20" />
      </Motion.div>
      <p className="mt-6 text-slate-400 font-bold text-lg">Loading profile...</p>
    </div>
  );

  const avatarSrc = user.profileImage;

  return (
    <div className="max-w-4xl mx-auto pb-24 px-5">
      <Motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 md:p-14 bg-white shadow-2xl shadow-primary/10 border-slate-100"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16 pb-12 border-b border-slate-100">
          <div className="flex items-center gap-8">
            {/* Avatar with upload */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-primary/20 overflow-hidden">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.name[0].toUpperCase()}</span>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                ) : (
                  <Camera size={22} className="text-white" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} id="photo-upload" />
              </label>
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{user.name}</h1>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary/20 inline-block">
                  {user.role} Account
                </span>
                <span className="text-xs text-slate-400 font-medium">Hover photo to change</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setEditing(!editing); setError(""); }}
            className={`btn px-8 py-3 font-black transition-all ${editing ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'btn-primary'}`}
          >
            {editing ? "Cancel" : <><Edit3 size={18} /> Edit Profile</>}
          </button>
        </div>

        {/* Alerts */}
        {success && (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-600 rounded-xl mb-10 border border-emerald-100 text-sm font-bold">
            <CheckCircle size={20} /> {success}
          </Motion.div>
        )}
        {error && (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-4 bg-rose-50 text-rose-600 rounded-xl mb-10 border border-rose-100 text-sm font-bold">
            <AlertCircle size={20} /> {error}
          </Motion.div>
        )}

        {/* Edit Form */}
        {editing ? (
          <form onSubmit={onSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Full Name</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <input type="text" name="name" value={formData.name} onChange={onChange} className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-semibold transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <input type="text" name="phone" value={formData.phone} onChange={onChange} className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-semibold transition-all" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Location</label>
              <div className="relative">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input type="text" name="location" value={formData.location} onChange={onChange} className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-semibold transition-all" />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary w-full py-5 text-lg group">
              {submitting ? (
                <div className="animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent" />
              ) : (
                <><Save size={22} className="transition-transform group-hover:scale-110" /> Save Changes</>
              )}
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { icon: <Mail size={24} />, label: "Email Address", value: user.email, color: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white" },
              { icon: <Phone size={24} />, label: "Phone Number", value: user.phone || "Not provided", color: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white" },
              { icon: <MapPin size={24} />, label: "Location", value: user.location || "Not set", color: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-4 p-6 bg-slate-50 rounded-card border border-slate-100 group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                  <p className="text-slate-900 font-black truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Motion.div>
    </div>
  );
};

export default Profile;
