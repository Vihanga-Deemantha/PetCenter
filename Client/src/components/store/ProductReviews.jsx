import React, { useState, useEffect, useCallback } from "react";
import { Star, MessageSquare, Trash2, Edit2, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { getProductReviews, getReviewEligibility, createReview, updateReview, deleteReview } from "../../api/review.api";
import { useAuth } from "../../context/AuthContext";
import { motion as Motion, AnimatePresence } from "framer-motion";

export default function ProductReviews({ productId }) {
  const { user } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [distribution, setDistribution] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");

  const [eligibility, setEligibility] = useState({ canReview: false });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProductReviews(productId, { page, limit: 5, sort });
      setReviews(res.data.data || []);
      setDistribution(res.data.meta?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      setPagination(res.data.meta?.pagination || {});
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [productId, page, sort]);

  const checkEligibility = useCallback(async () => {
    if (!user) {
      setEligibility({ canReview: false });
      return;
    }
    try {
      const res = await getReviewEligibility(productId);
      setEligibility(res.data.data || { canReview: false });
    } catch (err) {
      console.error("Failed to check review eligibility:", err);
    }
  }, [productId, user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  const totalReviewsCount = Object.values(distribution).reduce((a, b) => a + b, 0);
  const weightedSum = Object.entries(distribution).reduce((sum, [stars, count]) => sum + Number(stars) * count, 0);
  const avgRating = totalReviewsCount > 0 ? (weightedSum / totalReviewsCount).toFixed(1) : "0.0";

  const handleOpenWriteReview = () => {
    setEditingId(null);
    setRatingInput(5);
    setCommentInput("");
    setFormError("");
    setFormSuccess("");
    setIsFormOpen(true);
  };

  const handleOpenEditReview = (review) => {
    setEditingId(review._id);
    setRatingInput(review.rating);
    setCommentInput(review.comment || "");
    setFormError("");
    setFormSuccess("");
    setIsFormOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!ratingInput || ratingInput < 1 || ratingInput > 5) {
      setFormError("Please select a rating between 1 and 5 stars.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateReview(editingId, { rating: ratingInput, comment: commentInput });
        setFormSuccess("Your review has been successfully updated!");
      } else {
        await createReview(productId, { rating: ratingInput, comment: commentInput, orderId: eligibility.orderId });
        setFormSuccess("Thank you! Your review has been posted.");
      }

      setTimeout(() => {
        setIsFormOpen(false);
        setEditingId(null);
        fetchReviews();
        checkEligibility();
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.error || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete your review? This action cannot be undone.")) return;
    try {
      await deleteReview(reviewId);
      fetchReviews();
      checkEligibility();
    } catch {
      alert("Failed to delete review. Please try again.");
    }
  };

  const isWithin48Hours = (createdAt) => {
    const hours = (new Date() - new Date(createdAt)) / (1000 * 60 * 60);
    return hours <= 48;
  };

  return (
    <div className="border-t border-border pt-14 mt-14">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-9 gap-5">
        <div>
          <h2 className="font-heading text-[26px] font-medium tracking-tight mb-2">Customer reviews</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center text-primary">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={17} className={i < Math.round(Number(avgRating)) ? "fill-primary" : "text-border"} />
              ))}
            </div>
            <span className="text-[#292925] font-semibold">{avgRating} out of 5</span>
            <span className="text-[#8a8a80] text-sm">
              ({totalReviewsCount} {totalReviewsCount === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>

        {eligibility.canReview && !isFormOpen && (
          <button onClick={handleOpenWriteReview} className="btn btn-primary px-6 py-3">
            <MessageSquare size={15} /> Write a review
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-4 bg-light border border-border rounded-[24px] p-7">
          <h3 className="font-semibold text-[#292925] mb-5">Rating breakdown</h3>
          <div className="space-y-3.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution[stars] || 0;
              const percentage = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3">
                  <span className="w-11 text-sm font-medium text-[#3f3f38] flex items-center justify-end gap-1">
                    {stars} <Star size={11} className="fill-primary text-primary" />
                  </span>
                  <div className="flex-1 h-2.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="w-9 text-xs font-medium text-[#8a8a80] text-right">{percentage.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-7">
          <AnimatePresence>
            {isFormOpen && (
              <Motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="bg-white border border-accent/25 rounded-[24px] p-7">
                <h3 className="text-lg font-semibold text-[#292925] mb-5">{editingId ? "Update your review" : "Write a review"}</h3>

                {formError && (
                  <div className="flex items-center gap-2 p-3.5 bg-[#F7E9DF] text-[#8f4a28] rounded-xl mb-5 text-sm font-medium">
                    <AlertCircle size={16} />
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="flex items-center gap-2 p-3.5 bg-[#E9EDE4] text-[#40543C] rounded-xl mb-5 text-sm font-medium">
                    <CheckCircle2 size={16} />
                    {formSuccess}
                  </div>
                )}

                <form onSubmit={handleSubmitReview} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#8a8a80] mb-2.5">Overall rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <button key={stars} type="button" onClick={() => setRatingInput(stars)} className="text-primary hover:scale-110 active:scale-95 transition-transform">
                          <Star size={28} className={stars <= ratingInput ? "fill-primary text-primary" : "text-border"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#8a8a80]">Review comments</label>
                      <span className={`text-xs font-medium ${commentInput.length > 450 ? "text-[#8f4a28]" : "text-[#a8a49a]"}`}>{commentInput.length}/500</span>
                    </div>
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value.substring(0, 500))}
                      placeholder="Share your experience with this product... what did you like or dislike?"
                      rows={4}
                      className="w-full p-4 rounded-2xl bg-light border border-border focus:border-accent outline-none transition-colors text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-1">
                    <button type="button" onClick={() => setIsFormOpen(false)} disabled={submitting} className="px-5.5 py-3 bg-border text-[#4F5B4B] hover:bg-[#dcd4c6] rounded-full font-medium text-sm transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="btn btn-primary px-6 py-3">
                      {submitting ? "Submitting..." : editingId ? "Update review" : "Submit review"}
                    </button>
                  </div>
                </form>
              </Motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between border-b border-border pb-3.5">
            <span className="font-semibold text-[#292925]">Reviews ({pagination.totalItems ?? 0})</span>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-border bg-white font-medium text-xs text-[#3f3f38] outline-none cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="highest">Highest rating</option>
              <option value="lowest">Lowest rating</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-22 bg-border rounded-2xl" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-14 bg-light border border-dashed border-[#dcd4c6] rounded-[24px]">
              <MessageSquare size={32} className="mx-auto text-[#c9c2b3] mb-3" />
              <h4 className="font-semibold text-[#3f3f38]">No reviews yet</h4>
              <p className="text-xs text-[#8a8a80] max-w-xs mx-auto mt-1">Be the first to review this product! Make a purchase and receive it to share your thoughts.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => {
                const isUserReview = user && review.userId?._id === user._id;
                const canModify = isUserReview && isWithin48Hours(review.createdAt);

                return (
                  <div key={review._id} className="border-b border-border pb-5 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9.5 h-9.5 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-secondary font-semibold overflow-hidden shrink-0">
                          {review.userId?.profileImage ? <img src={review.userId.profileImage} alt="" className="w-full h-full object-cover" /> : <span>{review.userId?.name?.[0]?.toUpperCase()}</span>}
                        </div>
                        <div>
                          <p className="font-semibold text-[#292925] text-sm m-0">{review.userId?.name || "Verified Customer"}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="flex text-primary">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={11} className={i < review.rating ? "fill-primary" : "text-border"} />
                              ))}
                            </div>
                            <span className="text-[10px] text-[#8a8a80] font-medium">{new Date(review.createdAt).toLocaleDateString()}</span>
                            {isUserReview && <span className="px-1.5 py-0.5 bg-accent/10 text-secondary border border-accent/20 text-[9px] rounded-md font-semibold uppercase tracking-wider">Your review</span>}
                          </div>
                        </div>
                      </div>

                      {isUserReview && (
                        <div className="flex gap-2">
                          {canModify && (
                            <button onClick={() => handleOpenEditReview(review)} className="p-2 bg-light border border-border text-[#6e6e64] hover:text-primary rounded-lg transition-colors" title="Edit review (available for 48h)">
                              <Edit2 size={13} />
                            </button>
                          )}
                          <button onClick={() => handleDeleteReview(review._id)} className="p-2 bg-[#F7E9DF] border border-[#F0D9C8] text-[#8f4a28] hover:bg-[#f0d9c8] rounded-lg transition-colors" title="Delete review">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-[#5c5c54] text-sm leading-relaxed pl-12.5">{review.comment || <em className="text-[#a8a49a] text-xs">No comment left.</em>}</p>
                  </div>
                );
              })}

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-5 border-t border-border">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-border bg-white text-[#6e6e64] disabled:opacity-40">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-semibold text-[#6e6e64] px-2">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="p-2 rounded-lg border border-border bg-white text-[#6e6e64] disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
