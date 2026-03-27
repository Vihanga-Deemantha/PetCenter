import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../services/authService";
import { motion as Motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Edit3, Save, CheckCircle } from "lucide-react";

const Profile = () => {
  const { user, login } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    location: user?.location || "",
  });
  const [success, setSuccess] = useState(false);

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await updateProfile(formData);
      login(data.data, localStorage.getItem("token"));
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Profile update failed", error);
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
      <p className="mt-6 text-slate-400 font-bold text-lg">Waking up the pet center...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-24 px-5">
      <Motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 md:p-14 bg-white shadow-2xl shadow-indigo-500/10 border-slate-100"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16 pb-12 border-b border-slate-100">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-indigo-500/20">
              {user.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{user.name}</h1>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100 inline-block">
                {user.role} Account
              </span>
            </div>
          </div>
          <button 
            onClick={() => setEditing(!editing)} 
            className={`btn px-8 py-3 font-black transition-all ${editing ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'btn-primary'}`}
          >
            {editing ? "Cancel Edit" : <><Edit3 size={18} /> Edit Profile</>}
          </button>
        </div>

        {success && (
          <Motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-600 rounded-xl mb-10 border border-emerald-100 text-sm font-bold shadow-sm"
          >
            <CheckCircle size={20} /> Profile updated successfully!
          </Motion.div>
        )}

        {editing ? (
          <form onSubmit={onSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">User Name</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <input type="text" name="name" value={formData.name} onChange={onChange} className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-semibold transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <input type="email" name="email" value={formData.email} onChange={onChange} className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-semibold transition-all" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <input type="text" name="phone" value={formData.phone} onChange={onChange} className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-semibold transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Home Location</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <input type="text" name="location" value={formData.location} onChange={onChange} className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-semibold transition-all" />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full py-5 text-lg group">
              <Save size={22} className="transition-transform group-hover:scale-110" /> Save Profile Changes
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="flex flex-col gap-4 p-6 bg-slate-50 rounded-[24px] border border-slate-100 group">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email Address</p>
                <p className="text-slate-900 font-black truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6 bg-slate-50 rounded-[24px] border border-slate-100 group">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                <Phone size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Phone Number</p>
                <p className="text-slate-900 font-black">{user.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6 bg-slate-50 rounded-[24px] border border-slate-100 group md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Location</p>
                <p className="text-slate-900 font-black">{user.location || 'Globe'}</p>
              </div>
            </div>
          </div>
        )}
      </Motion.div>
    </div>
  );
};

export default Profile;
