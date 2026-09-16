import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Lock, ArrowLeft, ShieldCheck, CheckCircle, AlertCircle } from "lucide-react";
import { resetPassword } from "../api/auth.api";

const ResetPassword = () => {
  const { resetToken } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetToken, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-5 py-20 bg-light">
      <Motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#E8E2D8] rounded-card p-9 md:p-13 w-full max-w-md shadow-xl shadow-black/5">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[#8a8a80] hover:text-primary transition-colors mb-7">
          <ArrowLeft size={16} /> Back to login
        </Link>

        {!success ? (
          <>
            <div className="text-center mb-9">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={24} className="text-primary" />
              </div>
              <h2 className="font-heading text-[28px] font-medium text-[#292925] mb-2">Reset password</h2>
              <p className="text-[#6e6e64] text-sm">Enter your new password below.</p>
            </div>

            {error && (
              <Motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2.5 p-3.5 bg-[#F7E9DF] text-[#8f4a28] rounded-xl mb-5 text-sm font-medium">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </Motion.div>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              <label className="flex flex-col gap-1.75 text-[13px] text-[#6e6e64]">
                New password
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="border border-border rounded-2xl px-4 py-3.5 text-[15px] text-[#292925] bg-light focus:border-accent outline-none transition-colors" />
              </label>
              <label className="flex flex-col gap-1.75 text-[13px] text-[#6e6e64]">
                Confirm password
                <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="border border-border rounded-2xl px-4 py-3.5 text-[15px] text-[#292925] bg-light focus:border-accent outline-none transition-colors" />
              </label>

              <button type="submit" disabled={loading} className="btn btn-primary w-full py-4">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>
                  <ShieldCheck size={17} /> Reset password
                </>}
              </button>
            </form>
          </>
        ) : (
          <Motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
            <div className="w-16 h-16 bg-[#E9EDE4] rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={30} className="text-[#40543C]" />
            </div>
            <h3 className="font-heading text-2xl text-[#292925] mb-2.5">Password reset!</h3>
            <p className="text-[#6e6e64] text-sm mb-5">Your password has been successfully reset. Redirecting you to login...</p>
            <div className="w-7 h-7 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </Motion.div>
        )}
      </Motion.div>
    </div>
  );
};

export default ResetPassword;
