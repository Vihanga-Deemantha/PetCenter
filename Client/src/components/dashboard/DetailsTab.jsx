import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateProfile as updateProfileApi, uploadProfilePhoto } from "../../api/auth.api";
import { motion as Motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Camera, CheckCircle, AlertCircle } from "lucide-react";

export default function DetailsTab() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    location: user?.location || "",
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await updateProfileApi(formData);
      updateUser(res.data);
      setSuccess("Profile updated.");
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
      setSuccess("Photo updated.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Photo upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-7">
        <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-2.5">Dashboard</p>
        <h1 className="font-heading text-[30px] sm:text-[36px] font-medium tracking-tight text-[#292925]">Your details</h1>
      </div>

      <div className="bg-white border border-[#E8E2D8] rounded-[22px] p-7 sm:p-9">
        <div className="flex items-center gap-5 mb-8 pb-8 border-b border-border">
          <div className="relative group shrink-0">
            <div className="w-18 h-18 rounded-full bg-accent/20 flex items-center justify-center text-secondary text-2xl font-semibold overflow-hidden">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name?.[0]?.toUpperCase() || "?"}</span>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-[#292925]/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {uploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <Camera size={18} className="text-white" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
            </label>
          </div>
          <div>
            <h2 className="m-0 font-heading text-xl font-medium text-[#292925]">{user?.name}</h2>
            <p className="m-0 mt-0.5 text-[12.5px] text-[#8a8a80]">Hover your photo to change it</p>
          </div>
        </div>

        {success && (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5 p-3.5 bg-[#E9EDE4] text-[#40543C] rounded-xl mb-6 text-sm font-medium">
            <CheckCircle size={17} /> {success}
          </Motion.div>
        )}
        {error && (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5 p-3.5 bg-[#F7E9DF] text-[#8f4a28] rounded-xl mb-6 text-sm font-medium">
            <AlertCircle size={17} /> {error}
          </Motion.div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Full name" icon={User} name="name" value={formData.name} onChange={onChange} />
            <Field label="Phone number" icon={Phone} name="phone" value={formData.phone} onChange={onChange} />
          </div>
          <Field label="Location" icon={MapPin} name="location" value={formData.location} onChange={onChange} />
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8a8a80] mb-2">Email address</label>
            <div className="relative">
              <Mail className="absolute left-4.5 top-1/2 -translate-y-1/2 text-[#c9c2b3]" size={17} />
              <input type="email" value={user?.email || ""} disabled className="w-full pl-12 pr-5 py-3.25 rounded-xl bg-light border border-border text-[#8a8a80] outline-none text-sm" />
            </div>
            <p className="mt-1.5 text-[11.5px] text-[#a8a49a]">Email can't be changed here — contact support if you need this updated.</p>
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary px-7 py-3">
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, icon, name, value, onChange }) {
  const Icon = icon;
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8a8a80] mb-2">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4.5 top-1/2 -translate-y-1/2 text-primary" size={17} />
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          className="w-full pl-12 pr-5 py-3.25 rounded-xl bg-light border border-border focus:border-accent outline-none text-sm font-medium transition-colors"
        />
      </div>
    </div>
  );
}
