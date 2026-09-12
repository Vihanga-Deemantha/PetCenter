import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { registerUser } from "../api/auth.api";
import { motion as Motion } from "framer-motion";
import { User, Mail, Lock, Phone, MapPin, UserPlus, AlertCircle } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Already signed in — don't re-render the register form, just leave
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await registerUser(formData);
      login(data.data.user, data.data.accessToken);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page flex justify-center items-center min-h-screen px-5 py-24">
      <Motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-10 md:p-14 w-full max-w-2xl bg-white shadow-2xl shadow-primary/10 border-slate-100"
      >
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Create Account</h2>
          <p className="text-slate-500 font-medium">Join our <span className="text-primary font-black">PetCenter</span> community today</p>
        </div>

        {error && (
          <Motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 bg-rose-50 text-rose-600 rounded-xl mb-8 border border-rose-100 text-sm font-bold"
          >
            <AlertCircle size={18} />
            {error}
          </Motion.div>
        )}

        <form onSubmit={onSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Full Name</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input type="text" name="name" placeholder="John Doe" value={formData.name} onChange={onChange} required className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold placeholder:text-slate-300" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input type="email" name="email" placeholder="john@example.com" value={formData.email} onChange={onChange} required className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold placeholder:text-slate-300" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input type="text" name="phone" placeholder="+1234567890" value={formData.phone} onChange={onChange} required className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold placeholder:text-slate-300" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Location</label>
              <div className="relative">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input type="text" name="location" placeholder="City, Country" value={formData.location} onChange={onChange} required className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold placeholder:text-slate-300" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
              <input type="password" name="password" placeholder="Min 6 characters" value={formData.password} onChange={onChange} required minLength="6" className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold placeholder:text-slate-300" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full py-5 text-lg group" disabled={loading}>
            <span className="flex items-center justify-center gap-3">
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent" />
              ) : (
                <><UserPlus size={22} className="transition-transform group-hover:scale-110" /> Register</>
              )}
            </span>
          </button>
        </form>

        <p className="text-center mt-10 text-slate-500 font-bold">
          Already have an account? <Link to="/login" className="text-primary hover:underline decoration-2 underline-offset-4 ml-1">Login</Link>
        </p>
      </Motion.div>
    </div>
  );
};

export default Register;
