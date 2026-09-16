import React, { useState, useEffect, useCallback } from "react";
import { Star, EyeOff, RefreshCw, MessageSquare } from "lucide-react";
import { adminGetReviews, adminHideReview } from "../api/review.api";

const RATING_FILTERS = ["", "5", "4", "3", "2", "1"];
const VISIBILITY_FILTERS = [
  { value: "", label: "All" },
  { value: "true", label: "Visible" },
  { value: "false", label: "Hidden" },
];

const Stars = ({ rating }) => (
  <span className="inline-flex items-center gap-0.5 text-primary">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={13} className={i < rating ? "fill-current" : "text-[#dcd4c6]"} />
    ))}
  </span>
);

const AdminReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [actionId, setActionId] = useState(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (ratingFilter) params.rating = ratingFilter;
      if (visibilityFilter) params.isVisible = visibilityFilter;
      const res = await adminGetReviews(params);
      setReviews(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch { setReviews([]); }
    setLoading(false);
  }, [page, ratingFilter, visibilityFilter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleHide = async (id) => {
    setActionId(id);
    try {
      await adminHideReview(id);
      setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, isVisible: false } : r)));
    } catch { /* ignore */ }
    setActionId(null);
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-7 flex-wrap gap-4 pb-7 border-b border-border">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-2.5">Admin</p>
          <h1 className="font-heading text-[32px] font-medium tracking-tight text-[#292925]">Reviews</h1>
          <p className="text-[#6e6e64] mt-1">{pagination.totalItems || 0} product reviews total</p>
        </div>
        <button onClick={fetchReviews} className="p-2.75 bg-white border border-border rounded-xl text-primary hover:bg-primary/10 transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-6 mb-7">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mr-1">Rating</span>
          {RATING_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => { setRatingFilter(r); setPage(1); }}
              className={`inline-flex items-center justify-center rounded-full px-3.5 py-1.75 text-[12.5px] font-medium border transition-colors ${
                ratingFilter === r ? "bg-secondary text-light border-secondary" : "bg-white text-secondary border-border hover:bg-light"
              }`}
            >
              {r || "All"}{r && " ★"}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mr-1">Visibility</span>
          {VISIBILITY_FILTERS.map((v) => (
            <button
              key={v.value}
              onClick={() => { setVisibilityFilter(v.value); setPage(1); }}
              className={`inline-flex items-center justify-center rounded-full px-3.5 py-1.75 text-[12.5px] font-medium border transition-colors ${
                visibilityFilter === v.value ? "bg-secondary text-light border-secondary" : "bg-white text-secondary border-border hover:bg-light"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-border rounded-2xl animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-24">
          <MessageSquare size={44} className="mx-auto mb-4 text-[#c9c2b3]" />
          <p className="font-semibold text-[#292925]">No reviews found</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-[22px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Author", "Product", "Rating", "Comment", "Status", "Action"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#8a8a80] px-5 py-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviews.map((r) => (
                  <tr key={r._id} className="hover:bg-light/60 transition-colors align-top">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#292925] text-sm">{r.userId?.name || "Unknown"}</p>
                      <p className="text-xs text-[#8a8a80]">{r.userId?.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#3f3f38] max-w-[160px] truncate">{r.productId?.name || "—"}</td>
                    <td className="px-5 py-4"><Stars rating={r.rating} /></td>
                    <td className="px-5 py-4 text-sm text-[#5c5c54] max-w-xs">{r.comment || <span className="text-[#a8a49a]">—</span>}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-lg ${r.isVisible ? "bg-[#E9EDE4] text-[#40543C]" : "bg-[#EFEBE2] text-[#6e6e64]"}`}>
                        {r.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {r.isVisible ? (
                        <button
                          disabled={actionId === r._id}
                          onClick={() => handleHide(r._id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-all text-xs font-semibold disabled:opacity-50"
                        >
                          {actionId === r._id ? <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <EyeOff size={13} />}
                          Hide
                        </button>
                      ) : (
                        <span className="text-xs text-[#a8a49a]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-5 border-t border-border">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-full font-semibold text-xs transition-all ${page === i + 1 ? "bg-secondary text-light" : "border border-border text-secondary hover:bg-light"}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReviewManagement;
