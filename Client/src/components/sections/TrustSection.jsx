import React, { useState, useEffect } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Star, Shield, MessageSquare, Plus, X } from "lucide-react";
import { getPublicFeedbacks, submitFeedback } from "../../api/feedback.api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Skeleton card while loading
const SkeletonCard = () => (
  <div className="glass-card p-10 bg-white border-slate-100 shadow-sm flex flex-col gap-6 animate-pulse">
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-4 h-4 rounded-full bg-slate-100" />
      ))}
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-slate-100 rounded-lg w-full" />
      <div className="h-4 bg-slate-100 rounded-lg w-4/5" />
      <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
    </div>
    <div className="flex items-center gap-4 mt-auto">
      <div className="w-12 h-12 bg-slate-100 rounded-full" />
      <div className="space-y-1.5">
        <div className="h-3 bg-slate-100 rounded w-24" />
        <div className="h-3 bg-slate-100 rounded w-16" />
      </div>
    </div>
  </div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 25, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

const TrustSection = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Feedback form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchFeedbacks = () => {
    setLoading(true);
    getPublicFeedbacks()
      .then((res) => setTestimonials(res.data.data || []))
      .catch(() => setTestimonials([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleShareClick = () => {
    if (!user) {
      navigate("/login?redirect=/");
      return;
    }
    setIsModalOpen(true);
    setSubmitError("");
    setSuccessMsg("");
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !comment.trim()) {
      setSubmitError("Please provide a rating and a comment.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await submitFeedback(rating, comment);
      setSuccessMsg("Thank you! Your feedback has been submitted.");
      setComment("");
      setRating(5);
      fetchFeedbacks(); // refresh list
      setTimeout(() => {
        setIsModalOpen(false);
      }, 2000);
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  // Show at most 3 cards, last one full-width on md
  const display = testimonials.slice(0, 3);

  return (
    <section className="py-32 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-[5%]">
        <div className="flex flex-col lg:flex-row gap-20 items-center">

          {/* Trust Stats Side */}
          <div className="lg:w-1/3 flex flex-col gap-10">
            <div>
              <span className="text-primary font-black uppercase tracking-widest text-xs mb-4 block">
                Proven Excellence
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter mb-8 leading-tight">
                Trusted by pet lovers and experts.
              </h2>
            </div>

            <div className="flex flex-col gap-8">
              {[
                {
                  label: "Verified Users",
                  value: "100%",
                  icon: <Shield size={24} className="text-emerald-500" />,
                },
                {
                  label: "Genuine Feedback",
                  value: "Real",
                  icon: (
                    <Star
                      size={24}
                      fill="currentColor"
                      className="text-amber-500"
                    />
                  ),
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-6 p-6 bg-white rounded-3xl shadow-sm border border-slate-100"
                >
                  <div className="p-3 bg-slate-50 rounded-xl">{stat.icon}</div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-950">
                      {stat.value}
                    </h4>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}

              <button 
                onClick={handleShareClick}
                className="btn btn-primary mt-4 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform w-full md:w-auto"
              >
                <Plus size={20} /> Share Your Experience
              </button>
            </div>
          </div>

          {/* Testimonials Side */}
          {loading ? (
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
              <SkeletonCard />
              <SkeletonCard />
              <div className="md:col-span-2">
                <SkeletonCard />
              </div>
            </div>
          ) : display.length === 0 ? (
            /* Empty state */
            <div className="lg:w-2/3 flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <MessageSquare size={48} className="text-slate-200 mb-4" />
              <h4 className="font-black text-slate-700 text-xl mb-2">
                No feedback yet
              </h4>
              <p className="text-sm text-slate-400 font-bold max-w-xs">
                Be the first to share your experience on our platform — your feedback shapes our community.
              </p>
            </div>
          ) : (
            <Motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {display.map((review, i) => {
                const name = review.userId?.name || "Verified Customer";
                const avatar = review.userId?.profileImage;
                const initial = name[0]?.toUpperCase();

                return (
                  <Motion.div
                    key={review._id}
                    variants={itemVariants}
                    className={`glass-card p-10 bg-white border-slate-100 shadow-sm flex flex-col gap-6 relative ${i === 2 ? "md:col-span-2" : ""}`}
                  >
                    <MessageSquare
                      className="text-primary/10 absolute top-8 right-8"
                      size={64}
                    />

                    {/* Stars */}
                    <div className="flex gap-1 text-amber-400">
                      {[...Array(review.rating)].map((_, s) => (
                        <Star key={s} size={14} fill="currentColor" />
                      ))}
                    </div>

                    {/* Comment */}
                    <p className="text-lg text-slate-600 font-medium leading-relaxed italic relative z-10">
                      "{review.comment}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-4 mt-auto">
                      <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-full overflow-hidden flex items-center justify-center text-primary font-black">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{initial}</span>
                        )}
                      </div>
                      <div>
                        <h5 className="font-black text-slate-900">{name}</h5>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Verified User
                        </p>
                      </div>
                    </div>
                  </Motion.div>
                );
              })}
            </Motion.div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <Motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              <div className="p-8">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={24} />
                </button>
                
                <h3 className="text-2xl font-black text-slate-900 mb-2">Share Your Experience</h3>
                <p className="text-slate-500 font-medium mb-8">We value your genuine feedback about the PetCenter platform.</p>

                {successMsg ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 font-bold text-center">
                    {successMsg}
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                    {submitError && (
                      <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold">
                        {submitError}
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-widest">Your Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star
                              size={32}
                              fill={rating >= star ? "currentColor" : "none"}
                              className={rating >= star ? "text-amber-400" : "text-slate-300"}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-widest">Your Review</label>
                      <textarea
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none resize-none"
                        rows="4"
                        placeholder="Tell us what you love or how we can improve..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                        maxLength={1000}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary w-full py-4 rounded-xl text-lg flex justify-center items-center"
                    >
                      {submitting ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Submit Feedback"
                      )}
                    </button>
                  </form>
                )}
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
};

export default TrustSection;
