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
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
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
                <Mail size={24} className="text-primary" />
              </div>
              <h2 className="font-heading text-[28px] font-medium text-[#292925] mb-2">Forgot password?</h2>
              <p className="text-[#6e6e64] text-sm">No worries — enter your email and we'll send you a reset link.</p>
            </div>

            {error && (
              <Motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2.5 p-3.5 bg-[#F7E9DF] text-[#8f4a28] rounded-xl mb-5 text-sm font-medium">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </Motion.div>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              <label className="flex flex-col gap-1.75 text-[13px] text-[#6e6e64]">
                Email address
                <input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="border border-border rounded-2xl px-4 py-3.5 text-[15px] text-[#292925] bg-light focus:border-accent outline-none transition-colors" />
              </label>

              <button type="submit" disabled={loading} className="btn btn-primary w-full py-4">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={17} /> Send reset link
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <Motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
            <div className="w-16 h-16 bg-[#E9EDE4] rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={30} className="text-[#40543C]" />
            </div>
            <h3 className="font-heading text-2xl text-[#292925] mb-2.5">Check your email</h3>
            <p className="text-[#6e6e64] text-sm mb-1.5">
              If an account exists for <strong className="text-[#292925]">{email}</strong>, we've sent a password reset link.
            </p>
            <p className="text-[#8a8a80] text-xs mb-7">The link expires in 30 minutes. Check your spam folder if you don't see it.</p>
            <Link to="/login" className="btn btn-primary px-7 py-3 inline-flex">
              <ArrowLeft size={16} /> Back to login
            </Link>
          </Motion.div>
        )}
      </Motion.div>
    </div>
  );
};

export default ForgotPassword;
