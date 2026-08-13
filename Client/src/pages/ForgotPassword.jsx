import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from "lucide-react";
import { forgotPassword } from "../api/auth.api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
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
                <Mail size={28} className="text-primary" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
                Forgot Password?
              </h2>
              <p className="text-slate-500 font-medium text-sm">
                No worries! Enter your email and we'll send you a reset link.
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
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-primary"
                    size={20}
                  />
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
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
                      <Send
                        size={20}
                        className="transition-transform group-hover:translate-x-1"
                      />{" "}
                      Send Reset Link
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
              Check Your Email
            </h3>
            <p className="text-slate-500 font-medium text-sm mb-2">
              If an account exists for <strong className="text-slate-700">{email}</strong>,
              we've sent a password reset link.
            </p>
            <p className="text-slate-400 font-medium text-xs mb-8">
              The link expires in 30 minutes. Check your spam folder if you don't see it.
            </p>
            <Link
              to="/login"
              className="btn btn-primary px-8 py-3 inline-flex items-center gap-2"
            >
              <ArrowLeft size={18} /> Back to Login
            </Link>
          </Motion.div>
        )}
      </Motion.div>
    </div>
  );
};

export default ForgotPassword;
