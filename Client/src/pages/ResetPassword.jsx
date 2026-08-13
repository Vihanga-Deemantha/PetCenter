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
      // Auto-redirect to login after 3 seconds
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Reset failed. The link may have expired."
      );
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
        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to Login
        </Link>

        {!success ? (
          <>
            {/* Header */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={28} className="text-primary" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
                Reset Password
              </h2>
              <p className="text-slate-500 font-medium text-sm">
                Enter your new password below.
              </p>
            </div>

            {/* Error */}
            {error && (
              <Motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-4 bg-rose-50 text-rose-600 rounded-xl mb-6 border border-rose-100 text-sm font-bold"
              >
                <AlertCircle size={18} />
                {error}
              </Motion.div>
            )}

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                  New Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-primary"
                    size={20}
                  />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-primary"
                    size={20}
                  />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold placeholder:text-slate-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full py-5 text-lg group"
                disabled={loading}
              >
                <span className="flex items-center justify-center gap-3">
                  {loading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent" />
                  ) : (
                    <>
                      <ShieldCheck
                        size={20}
                        className="transition-transform group-hover:scale-110"
                      />{" "}
                      Reset Password
                    </>
                  )}
                </span>
              </button>
            </form>
          </>
        ) : (
          /* Success state */
          <Motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">
              Password Reset!
            </h3>
            <p className="text-slate-500 font-medium text-sm mb-6">
              Your password has been successfully reset. Redirecting you to login...
            </p>
            <div className="w-8 h-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </Motion.div>
        )}
      </Motion.div>
    </div>
  );
};

export default ResetPassword;
