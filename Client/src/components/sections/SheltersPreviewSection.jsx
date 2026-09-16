import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getShelters } from "../../api/shelter.api";

const SheltersPreviewSection = () => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShelters({ limit: 4 })
      .then((res) => setShelters(res.data.data || []))
      .catch(() => setShelters([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && shelters.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-7 pt-24">
      <div className="mb-9">
        <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-3">Partner shelters</p>
        <h2 className="font-heading text-[32px] sm:text-[46px] font-medium text-[#292925] tracking-tight">The people doing the work</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse h-38 bg-border rounded-[20px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {shelters.map((s) => (
            <Link
              key={s._id}
              to={`/shelters/${s._id}`}
              className="bg-white border border-[#E8E2D8] rounded-[20px] p-5.5 flex flex-col gap-3.5 hover:border-accent transition-colors"
            >
              <span className="w-11 h-11 rounded-[14px] bg-border flex items-center justify-center font-heading text-lg text-secondary overflow-hidden shrink-0">
                {s.logo?.url ? <img src={s.logo.url} alt={s.name} className="w-full h-full object-cover" /> : s.name?.[0]?.toUpperCase()}
              </span>
              <div>
                <p className="m-0 text-[15px] font-semibold text-[#292925] truncate">{s.name}</p>
                <p className="mt-1 text-[13px] text-[#8a8a80]">{s.location?.city}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default SheltersPreviewSection;
