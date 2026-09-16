import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Image as ImageIcon, Shuffle } from "lucide-react";
import { getGallery } from "../api/ecosystem.api";
import { PET_ICONS } from "./EcosystemPicker";
import EcosystemTabs from "../components/ecosystem/EcosystemTabs";
import { formatPrice } from "../utils/priceFormatter";

const ALL_PET_TYPES = ["fish", "snake", "bird", "spider", "turtle", "mouse", "reptile", "amphibian"];
const PET_LABELS = { fish: "Fish", snake: "Snake", bird: "Bird", spider: "Spider", turtle: "Turtle", mouse: "Mouse", reptile: "Reptile", amphibian: "Amphibian" };

const formatDate = (iso) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const chipCls = (active) =>
  `inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2.25 text-[12.5px] font-medium border transition-colors ${
    active ? "bg-secondary text-light border-secondary" : "bg-white text-secondary border-border hover:bg-light"
  }`;

export default function EcosystemGallery() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activePetType = searchParams.get("petType") || "";
  const activeSort = searchParams.get("sort") || "newest";

  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 12;

  const fetchGallery = useCallback(
    async (reset = false) => {
      if (reset) setBuilds([]);
      setLoading(true);
      try {
        const currentPage = reset ? 1 : page;
        const params = { page: currentPage, limit: LIMIT, sort: activeSort };
        if (activePetType) params.petType = activePetType;
        const res = await getGallery(params);
        const { data, pagination } = res.data;
        setBuilds((prev) => (reset ? data || [] : [...prev, ...(data || [])]));
        setHasMore(pagination?.currentPage < pagination?.totalPages);
        if (reset) setPage(2);
        else setPage((p) => p + 1);
      } catch {
        setError("Failed to load gallery. Please refresh.");
      } finally {
        setLoading(false);
      }
    },
    [activePetType, activeSort, page]
  );

  useEffect(() => {
    document.title = "Inspiration gallery | PetCenter Ecosystem";
    fetchGallery(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePetType, activeSort]);

  const setFilter = (petType) => {
    const next = new URLSearchParams(searchParams);
    if (petType) next.set("petType", petType);
    else next.delete("petType");
    setSearchParams(next, { replace: true });
  };

  const setSort = (sort) => {
    const next = new URLSearchParams(searchParams);
    next.set("sort", sort);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="max-w-7xl mx-auto px-7 pt-8 pb-24">
      <div className="mb-7">
        <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-3.5">Ecosystems</p>
        <h1 className="font-heading text-[34px] sm:text-[44px] font-medium tracking-tight mb-2.5">Community builds</h1>
        <p className="text-[15px] leading-relaxed text-[#5c5c54] max-w-160">Finished habitats with full parts lists. Clone any of them into your own build and change what you like.</p>
      </div>

      <EcosystemTabs />

      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter("")} className={chipCls(!activePetType)}>
            All
          </button>
          {ALL_PET_TYPES.map((pet) => (
            <button key={pet} onClick={() => setFilter(pet)} className={chipCls(activePetType === pet)}>
              {PET_ICONS[pet] || "🐾"} {PET_LABELS[pet]}
            </button>
          ))}
        </div>
        <select
          value={activeSort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-border rounded-full px-4 py-2.25 text-[13px] font-medium text-[#3f3f38] bg-white outline-none cursor-pointer"
        >
          <option value="newest">Newest first</option>
          <option value="mostCloned">Most cloned</option>
        </select>
      </div>

      {error ? (
        <div className="text-center py-12 bg-[#F7E9DF] rounded-2xl text-[#8f4a28]">{error}</div>
      ) : loading && builds.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-70 bg-border rounded-[22px] animate-pulse" />
          ))}
        </div>
      ) : builds.length === 0 ? (
        <div className="bg-white border border-dashed border-[#dcd4c6] rounded-[22px] py-14 px-8 text-center">
          <ImageIcon size={36} className="mx-auto mb-3.5 text-[#c9c2b3]" />
          <h3 className="font-heading text-xl font-medium mb-1.5">No builds in the gallery yet</h3>
          <p className="text-[#6e6e64] text-sm max-w-xs mx-auto">Be the first to share yours — build a setup and publish it from your Dashboard.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {builds.map((build, i) => (
              <Motion.button
                key={build._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 6) * 0.04 }}
                onClick={() => navigate(`/ecosystem/gallery/${build._id}`)}
                className="text-left bg-white border border-[#E8E2D8] rounded-[22px] p-5.5 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-xl shrink-0">{PET_ICONS[build.petType] || "🐾"}</div>
                  <div className="min-w-0">
                    <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-[#8a8a80] capitalize">{build.petType} setup</p>
                    <p className="m-0 font-heading text-[17px] font-medium truncate">{build.name}</p>
                  </div>
                </div>

                <p className="m-0 mb-4 text-[12.5px] text-[#6e6e64]">
                  by <span className="font-semibold text-secondary">{build.userId?.name || "Anonymous"}</span> · {build.selections?.length || 0} items ·{" "}
                  <strong className="text-[#292925]">{formatPrice(build.totalPrice)}</strong>
                </p>

                <div className="mt-auto flex items-center justify-between gap-3">
                  {build.cloneCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-secondary bg-accent/10 rounded-full px-2.75 py-1.25">
                      <Shuffle size={11} /> {build.cloneCount} {build.cloneCount === 1 ? "person" : "people"} built this
                    </span>
                  ) : (
                    <span className="text-[12px] text-[#a8a49a]">Be the first to clone!</span>
                  )}
                  <span className="text-[11px] text-[#8a8a80] whitespace-nowrap">{formatDate(build.publishedAt || build.createdAt)}</span>
                </div>
              </Motion.button>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-9">
              <button onClick={() => fetchGallery(false)} disabled={loading} className="btn border border-[#cfc8ba] text-secondary hover:bg-border px-7 py-3">
                {loading ? "Loading…" : "Load more builds"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
