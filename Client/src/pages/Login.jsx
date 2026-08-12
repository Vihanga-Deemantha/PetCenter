import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../api/auth.api";
import { motion as Motion } from "framer-motion";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(formData);
      login(data.data.user, data.data.accessToken);
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      navigate(redirect ? decodeURIComponent(redirect) : "/");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page flex justify-center items-center min-h-[80vh] px-5 py-20">
      <Motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 md:p-14 w-full max-w-lg bg-white shadow-2xl shadow-primary/10 border-slate-100"
      >
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Welcome Back</h2>
          <p className="text-slate-500 font-medium">Login to your <span className="text-primary font-black">PetCenter</span> account</p>
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

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
              <input
                type="email"
                name="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={onChange}
                required
                className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold placeholder:text-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={onChange}
                required
                className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm font-bold text-primary hover:underline decoration-2 underline-offset-4">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary w-full py-5 text-lg group" disabled={loading}>
            <span className="flex items-center justify-center gap-3">
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent" />
              ) : (
                <><LogIn size={22} className="transition-transform group-hover:translate-x-1" /> Login</>
              )}
            </span>
          </button>
        </form>

        <p className="text-center mt-10 text-slate-500 font-bold">
          Don't have an account? <Link to="/register" className="text-primary hover:underline decoration-2 underline-offset-4 ml-1">Sign Up</Link>
        </p>
      </Motion.div>
    </div>
  );
};

export default Login;
