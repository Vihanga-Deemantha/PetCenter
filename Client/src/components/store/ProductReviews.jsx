import React, { useState, useEffect, useCallback } from "react";
import { Star, MessageSquare, Trash2, Edit2, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { getProductReviews, getReviewEligibility, createReview, updateReview, deleteReview } from "../../api/review.api";
import { useAuth } from "../../context/AuthContext";
import { motion as Motion, AnimatePresence } from "framer-motion";

export default function ProductReviews({ productId }) {
  const { user } = useAuth();
  
  // Review listing states
  const [reviews, setReviews] = useState([]);
  const [distribution, setDistribution] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");

  // User review form states
  const [eligibility, setEligibility] = useState({ canReview: false });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Fetch reviews & distribution
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

  // Fetch eligibility
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

  // Calculate average and total count
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
        // Edit existing review
        await updateReview(editingId, { rating: ratingInput, comment: commentInput });
        setFormSuccess("Your review has been successfully updated!");
      } else {
        // Create new review
        await createReview(productId, {
          rating: ratingInput,
          comment: commentInput,
          orderId: eligibility.orderId
        });
        setFormSuccess("Thank you! Your review has been posted.");
      }

      // Refresh list & eligibility
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

  // Helper: check if review can be edited (within 48h)
  const isWithin48Hours = (createdAt) => {
    const hours = (new Date() - new Date(createdAt)) / (1000 * 60 * 60);
    return hours <= 48;
  };

  return (
    <div className="border-t border-slate-100 pt-16 mt-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Customer Reviews</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={i < Math.round(Number(avgRating)) ? "fill-amber-500" : "text-slate-200"}
                />
              ))}
            </div>
            <span className="text-slate-900 font-black text-lg">{avgRating} out of 5</span>
            <span className="text-slate-400 font-bold text-sm">({totalReviewsCount} {totalReviewsCount === 1 ? "review" : "reviews"})</span>
          </div>
        </div>

        {eligibility.canReview && !isFormOpen && (
          <button
            onClick={handleOpenWriteReview}
            className="btn btn-primary px-6 py-3 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <MessageSquare size={16} /> Write a Review
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Rating Breakdown & Distribution */}
        <div className="lg:col-span-4 bg-slate-50 border border-slate-100 rounded-3xl p-8">
          <h3 className="font-black text-slate-900 text-lg mb-6">Rating Breakdown</h3>
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution[stars] || 0;
              const percentage = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3">
                  <span className="w-12 text-sm font-bold text-slate-600 flex items-center justify-end gap-1">
                    {stars} <Star size={12} className="fill-amber-500 text-amber-500" />
                  </span>
                  <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-xs font-bold text-slate-400 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews List / Form Area */}
        <div className="lg:col-span-8 space-y-8">
          {/* Write/Edit Form Panel */}
          <AnimatePresence>
            {isFormOpen && (
              <Motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white border border-primary/20 rounded-3xl p-8 shadow-xl shadow-primary/5"
              >
                <h3 className="text-xl font-black text-slate-900 mb-6">
                  {editingId ? "Update Your Review" : "Write a Review"}
                </h3>

                {formError && (
                  <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl mb-6 text-sm font-bold">
                    <AlertCircle size={18} />
                    {formError}
                  </div>
                )}

                {formSuccess && (
                  <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl mb-6 text-sm font-bold">
                    <CheckCircle2 size={18} />
                    {formSuccess}
                  </div>
                )}

                <form onSubmit={handleSubmitReview} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Overall Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <button
                          key={stars}
                          type="button"
                          onClick={() => setRatingInput(stars)}
                          className="text-amber-500 hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Star
                            size={32}
                            className={stars <= ratingInput ? "fill-amber-500 text-amber-500" : "text-slate-200"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Review Comments</label>
                      <span className={`text-xs font-bold ${commentInput.length > 450 ? "text-rose-500" : "text-slate-400"}`}>
                        {commentInput.length}/500
                      </span>
                    </div>
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value.substring(0, 500))}
                      placeholder="Share your experience with this product... what did you like or dislike?"
                      rows={4}
                      className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all font-semibold placeholder:text-slate-300 text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-6 py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary px-6 py-3 rounded-xl shadow-lg shadow-primary/20"
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : editingId ? "Update Review" : "Submit Review"}
                    </button>
                  </div>
                </form>
              </Motion.div>
            )}
          </AnimatePresence>

          {/* List and Filter Headers */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="font-black text-slate-900 text-lg">Reviews ({pagination.totalItems ?? 0})</span>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>

          {/* Review items */}
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
              <MessageSquare size={36} className="mx-auto text-slate-300 mb-3" />
              <h4 className="font-black text-slate-700">No Reviews Yet</h4>
              <p className="text-xs text-slate-400 font-bold max-w-xs mx-auto mt-1">
                Be the first to review this product! Make a purchase and receive it to share your thoughts.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => {
                const isUserReview = user && review.userId?._id === user._id;
                const canModify = isUserReview && isWithin48Hours(review.createdAt);

                return (
                  <div key={review._id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black overflow-hidden">
                          {review.userId?.profileImage ? (
                            <img src={review.userId.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{review.userId?.name?.[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{review.userId?.name || "Verified Customer"}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="flex text-amber-500">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={i < review.rating ? "fill-amber-500" : "text-slate-200"}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                            {isUserReview && (
                              <span className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[9px] rounded-md font-black uppercase tracking-wider">
                                Your Review
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* User actions: edit & delete */}
                      {isUserReview && (
                        <div className="flex gap-2">
                          {canModify && (
                            <button
                              onClick={() => handleOpenEditReview(review)}
                              className="p-2 bg-slate-50 border border-slate-100 text-slate-500 hover:text-primary rounded-lg transition-colors"
                              title="Edit review (available for 48h)"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="p-2 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                            title="Delete review"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-slate-600 text-sm font-medium leading-relaxed pl-13">
                      {review.comment || <em className="text-slate-300 text-xs">No comment left.</em>}
                    </p>
                  </div>
                );
              })}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-50">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-40 disabled:hover:border-slate-200"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-black text-slate-500 px-2">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-40 disabled:hover:border-slate-200"
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
