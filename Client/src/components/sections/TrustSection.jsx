import React, { useState, useEffect } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, Plus, X } from "lucide-react";
import { getPublicFeedbacks, submitFeedback } from "../../api/feedback.api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const SkeletonCard = () => (
  <div className="bg-light border border-[#ded6c8] rounded-card p-7 flex flex-col gap-4.5 animate-pulse">
    <div className="h-4 bg-border w-full rounded-full" />
    <div className="h-4 bg-border w-4/5 rounded-full" />
    <div className="h-9 bg-border w-9 rounded-full mt-4" />
  </div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 16 } },
};

const TrustSection = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      fetchFeedbacks();
      setTimeout(() => setIsModalOpen(false), 2000);
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const display = testimonials.slice(0, 3);

  return (
    <section className="mt-24 bg-border border-y border-[#ded6c8]">
      <div className="max-w-7xl mx-auto px-7 py-22">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-3">Reviews</p>
            <h2 className="font-heading text-[32px] sm:text-[46px] font-medium text-[#292925] tracking-tight">From people who stayed</h2>
          </div>
          <button onClick={handleShareClick} className="hidden sm:inline-flex btn btn-primary px-6 py-3 text-sm shrink-0">
            <Plus size={16} /> Share your experience
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : display.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-light rounded-card border border-dashed border-[#dcd4c6]">
            <MessageSquare size={40} className="text-[#c9c2b3] mb-3.5" />
            <h4 className="font-semibold text-[#292925] text-lg mb-1.5">No feedback yet</h4>
            <p className="text-sm text-[#8a8a80] max-w-xs">Be the first to share your experience — your feedback shapes our community.</p>
            <button onClick={handleShareClick} className="btn btn-primary mt-6 px-6 py-3 text-sm sm:hidden">
              <Plus size={16} /> Share your experience
            </button>
          </div>
        ) : (
          <Motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {display.map((review) => {
              const name = review.userId?.name || "Verified Customer";
              const avatar = review.userId?.profileImage;
              const initial = name[0]?.toUpperCase();
              return (
                <Motion.figure
                  key={review._id}
                  variants={itemVariants}
                  className="m-0 bg-light border border-[#ded6c8] rounded-card p-7 flex flex-col gap-4.5"
                >
                  <div className="flex gap-1 text-primary">
                    {[...Array(review.rating)].map((_, s) => (
                      <Star key={s} size={13} fill="currentColor" />
                    ))}
                  </div>
                  <p className="font-heading text-[19px] leading-snug text-[#292925] m-0 flex-1">"{review.comment}"</p>
                  <figcaption className="flex items-center gap-3 mt-auto">
                    <span className="w-9 h-9 rounded-full bg-border overflow-hidden flex items-center justify-center text-secondary font-semibold text-sm shrink-0">
                      {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : initial}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-[#292925]">{name}</span>
                      <span className="block text-xs text-[#8a8a80]">Verified user</span>
                    </span>
                  </figcaption>
                </Motion.figure>
              );
            })}
          </Motion.div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#292925]/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <Motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative w-full max-w-lg bg-light rounded-card shadow-2xl overflow-hidden z-10"
            >
              <div className="p-8">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-[#8a8a80] hover:text-[#292925] transition-colors">
                  <X size={22} />
                </button>

                <h3 className="font-heading text-2xl text-[#292925] mb-2">Share your experience</h3>
                <p className="text-[#6e6e64] mb-7">We value your genuine feedback about the PetCenter platform.</p>

                {successMsg ? (
                  <div className="p-5 bg-[#E9EDE4] border border-[#cddac2] rounded-2xl text-[#40543C] font-semibold text-center">{successMsg}</div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-5.5">
                    {submitError && <div className="p-3.5 bg-[#F7E9DF] text-[#8f4a28] rounded-xl text-sm font-medium">{submitError}</div>}

                    <div>
                      <label className="block text-xs font-semibold text-[#292925] mb-2.5 uppercase tracking-wider">Your rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button type="button" key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                            <Star size={28} fill={rating >= star ? "currentColor" : "none"} className={rating >= star ? "text-primary" : "text-[#dcd4c6]"} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#292925] mb-2 uppercase tracking-wider">Your review</label>
                      <textarea
                        className="w-full bg-white border border-[#dcd4c6] rounded-xl p-4 text-[#292925] focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none resize-none"
                        rows="4"
                        placeholder="Tell us what you love or how we can improve..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                        maxLength={1000}
                      />
                    </div>

                    <button type="submit" disabled={submitting} className="btn btn-primary w-full py-3.5">
                      {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Submit feedback"}
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
