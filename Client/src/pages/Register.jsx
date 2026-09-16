import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { registerUser } from "../api/auth.api";
import { motion as Motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import AuthSplitLayout from "../components/auth/AuthSplitLayout";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";

const INTERESTS = ["Adopting", "Shopping supplies", "Building a habitat", "Supporting shelters", "Fostering"];

const passwordStrength = (p) => {
  let n = 0;
  if (p.length >= 8) n++;
  if (/[A-Z]/.test(p)) n++;
  if (/[0-9]/.test(p)) n++;
  if (/[^A-Za-z0-9]/.test(p)) n++;
  return n;
};
const STRENGTH_LABELS = ["Too short", "Weak", "Getting there", "Good", "Strong"];

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", location: "" });
  const [interests, setInterests] = useState([]);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const toggleInterest = (label) =>
    setInterests((prev) => (prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]));

  const goToStepTwo = (e) => {
    e.preventDefault();
    if (formData.name.trim().length < 2) return setError("Tell us the name you'd like on your profile.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim())) return setError("That email address doesn't look right.");
    if (!formData.phone.trim()) return setError("Please add a phone number.");
    if (formData.password.length < 6) return setError("Passwords need at least 6 characters.");
    setError("");
    setStep(2);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location.trim()) return setError("Let us know your location.");
    if (!terms) return setError("Please accept the terms to continue.");
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

  const strength = passwordStrength(formData.password);

  return (
    <AuthSplitLayout
      panelBg="#78866F"
      panelVideo="/video/Sign-Up-Video.mp4"
      heading={<>Care starts with<br />knowing them</>}
      description="Join thousands of owners who adopt, shop and build habitats in one calm place."
      maxWidthClass="max-w-235"
    >
      <div className="flex items-center justify-between gap-4 mb-6.5">
        <div className="flex items-center gap-2.5">
          {[1, 2].map((n) => (
            <span key={n} className="h-1 rounded-full transition-all duration-300" style={{ width: step === n ? 28 : 14, background: step >= n ? "#78866F" : "#D8D2C6" }} />
          ))}
          <span className="text-xs text-[#6e6e64] ml-1.5">Step {step} of 2</span>
        </div>
        <Link to="/" className="text-[13px] text-[#6e6e64]">
          Back to site
        </Link>
      </div>

      <h1 className="font-heading text-[34px] font-medium tracking-tight mb-2.5">
        {step === 1 ? "Create your account" : "A little about you"}
      </h1>
      <p className="text-[15px] leading-relaxed text-[#5c5c54] mb-7">
        {step === 1
          ? "One profile for adopting, shopping, building habitats and supporting shelters."
          : "This shapes what we show you first. You can change all of it later."}
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

      <form onSubmit={step === 1 ? goToStepTwo : onSubmit} className="flex flex-col gap-4">
        {step === 1 ? (
          <>
            <label className="flex flex-col gap-1.75 text-[13px] text-[#6e6e64]">
              Full name
              <input name="name" value={formData.name} onChange={onChange} placeholder="Ana Reyes" className="border border-border rounded-2xl px-4 py-3.5 text-[15px] text-[#292925] bg-white focus:border-accent outline-none transition-colors" />
            </label>
            <label className="flex flex-col gap-1.75 text-[13px] text-[#6e6e64]">
              Email address
              <input type="email" name="email" value={formData.email} onChange={onChange} placeholder="you@example.com" className="border border-border rounded-2xl px-4 py-3.5 text-[15px] text-[#292925] bg-white focus:border-accent outline-none transition-colors" />
            </label>
            <label className="flex flex-col gap-1.75 text-[13px] text-[#6e6e64]">
              Phone number
              <input name="phone" value={formData.phone} onChange={onChange} placeholder="+1 234 567 890" className="border border-border rounded-2xl px-4 py-3.5 text-[15px] text-[#292925] bg-white focus:border-accent outline-none transition-colors" />
            </label>
            <label className="flex flex-col gap-1.75 text-[13px] text-[#6e6e64]">
              Password
              <input type="password" name="password" value={formData.password} onChange={onChange} placeholder="At least 6 characters" className="border border-border rounded-2xl px-4 py-3.5 text-[15px] text-[#292925] bg-white focus:border-accent outline-none transition-colors" />
            </label>
            <div>
              <div className="flex gap-1.5 mb-2">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="h-1 flex-1 rounded-full" style={{ background: i < strength ? (strength <= 2 ? "#C87550" : "#78866F") : "#E8E2D8" }} />
                ))}
              </div>
              <p className="m-0 text-xs text-[#6e6e64]">
                {formData.password === "" ? "Use six characters or more, mixing letters and numbers." : STRENGTH_LABELS[strength]}
              </p>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="m-0 mb-3 text-[13px] text-[#6e6e64]">What brings you here? Pick any.</p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((label) => {
                  const on = interests.includes(label);
                  return (
                    <button
                      type="button"
                      key={label}
                      onClick={() => toggleInterest(label)}
                      className="rounded-full px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors"
                      style={{ border: `1px solid ${on ? "#78866F" : "#E8E2D8"}`, background: on ? "#78866F" : "#fff", color: on ? "#fff" : "#4F5B4B" }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="flex flex-col gap-1.75 text-[13px] text-[#6e6e64] mt-1">
              Where are you?
              <input name="location" value={formData.location} onChange={onChange} placeholder="Colombo, Sri Lanka" className="border border-border rounded-2xl px-4 py-3.5 text-[15px] text-[#292925] bg-white focus:border-accent outline-none transition-colors" />
            </label>
            <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[#3f3f38] cursor-pointer mt-1">
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="w-3.75 h-3.75 accent-accent mt-0.5 shrink-0" />
              <span>
                I agree to the{" "}
                <Link to="/terms" className="text-secondary font-medium">
                  terms
                </Link>{" "}
                and the{" "}
                <Link to="/privacy" className="text-secondary font-medium">
                  privacy policy
                </Link>
                .
              </span>
            </label>
          </>
        )}

        <div className="flex gap-3 mt-1">
          {step === 2 && (
            <button type="button" onClick={() => setStep(1)} className="border border-[#cfc8ba] text-secondary rounded-full px-6.5 py-4 text-[15px] font-medium bg-transparent shrink-0">
              Back
            </button>
          )}
          <button type="submit" disabled={loading} className="btn btn-primary flex-1 py-4">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : step === 1 ? "Continue" : "Create account"}
          </button>
        </div>
      </form>

      {step === 1 && (
        <>
          <div className="flex items-center gap-3.5 my-6">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-[#6e6e64]">or sign up with</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleSignInButton onSuccess={(u, token) => { login(u, token); navigate("/"); }} onError={setError} />
        </>
      )}

      <p className="text-center mt-6.5 text-sm text-[#5c5c54]">
        Already a member?{" "}
        <Link to="/login" className="text-[#A8522C] font-medium">
          Log in
        </Link>
      </p>
    </AuthSplitLayout>
  );
};

export default Register;
