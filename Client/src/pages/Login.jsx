import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../api/auth.api";
import { motion as Motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import AuthSplitLayout from "../components/auth/AuthSplitLayout";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      navigate(redirect ? decodeURIComponent(redirect) : "/", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const goPostLogin = () => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    navigate(redirect ? decodeURIComponent(redirect) : "/");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser({ ...formData, remember });
      login(data.data.user, data.data.accessToken);
      goPostLogin();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      panelBg="#4F5B4B"
      panelVideo="/video/Login-Video.mp4"
      heading={<>Good to see<br />you again</>}
      description="Your saved pets, habitat builds and orders are waiting exactly as you left them."
    >
      <div className="flex items-center justify-between gap-4 mb-7.5">
        <p className="m-0 text-[11px] tracking-[0.16em] uppercase text-accent font-semibold">Log in</p>
        <Link to="/" className="text-[13px] text-[#6e6e64]">
          Back to site
        </Link>
      </div>

      <h1 className="font-heading text-[34px] font-medium tracking-tight mb-2.5">Welcome back</h1>
      <p className="text-[15px] leading-relaxed text-[#5c5c54] mb-7.5">
        Pick up where you left off — saved searches, builds and orders are all here.
      </p>

      {error && (
        <Motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2.5 p-3.5 bg-[#F7E9DF] text-[#8f4a28] rounded-xl mb-4 text-sm font-medium"
        >
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </Motion.div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.75 text-[13px] text-[#6e6e64]">
          Email address
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            placeholder="you@example.com"
            required
            className="border border-border rounded-2xl px-4 py-3.5 text-[15px] text-[#292925] bg-white focus:border-accent outline-none transition-colors"
          />
        </label>
        <label className="flex flex-col gap-1.75 text-[13px] text-[#6e6e64]">
          Password
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={onChange}
            placeholder="Your password"
            required
            className="border border-border rounded-2xl px-4 py-3.5 text-[15px] text-[#292925] bg-white focus:border-accent outline-none transition-colors"
          />
        </label>

        <div className="flex items-center justify-between gap-3.5">
          <label className="flex items-center gap-2.25 text-[13px] text-[#3f3f38] cursor-pointer">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-3.75 h-3.75 accent-accent" />
            Keep me signed in
          </label>
          <Link to="/forgot-password" className="text-[13px] text-secondary">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary py-4 mt-1">
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Log in"}
        </button>
      </form>

      <div className="flex items-center gap-3.5 my-6.5">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-[#6e6e64]">or continue with</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleSignInButton onSuccess={(u, token) => { login(u, token); goPostLogin(); }} onError={setError} />

      <p className="text-center mt-7 text-sm text-[#5c5c54]">
        New to PetCenter?{" "}
        <Link to="/register" className="text-[#A8522C] font-medium">
          Create an account
        </Link>
      </p>
    </AuthSplitLayout>
  );
};

export default Login;
