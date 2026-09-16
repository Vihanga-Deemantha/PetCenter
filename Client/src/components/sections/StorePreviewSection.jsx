import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { getProducts } from "../../api/product.api";
import { formatPrice } from "../../utils/priceFormatter";

const CATEGORIES = [
  { value: "food", label: "Food & treats" },
  { value: "habitat", label: "Habitat" },
  { value: "accessories", label: "Accessories" },
  { value: "healthcare", label: "Health" },
  { value: "cleaning", label: "Cleaning" },
  { value: "toys", label: "Toys & play" },
];

const StorePreviewSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts({ limit: 4 })
      .then((res) => setProducts(res.data.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-7 pt-24">
      <div className="flex items-end justify-between gap-6 mb-7">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-3">The store</p>
          <h2 className="font-heading text-[32px] sm:text-[46px] font-medium text-[#292925] tracking-tight">Essentials, quietly made</h2>
        </div>
        <Link to="/products" className="hidden sm:inline text-sm font-medium text-secondary border-b border-[#cfc8ba] pb-0.75 shrink-0">
          All products
        </Link>
      </div>

      <div className="flex flex-wrap gap-2.5 mb-7.5">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.value}
            to={`/products?category=${cat.value}`}
            className="inline-flex items-center border border-[#ddd6c8] rounded-full px-4.5 py-2.25 text-[13px] text-secondary bg-white hover:bg-border transition-colors"
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex flex-col gap-3">
              <div className="aspect-square bg-border rounded-2xl" />
              <div className="h-4 bg-border w-1/2 rounded-full" />
              <div className="h-4 bg-border/70 w-2/3 rounded-full" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center bg-white border border-dashed border-[#dcd4c6] rounded-card">
          <p className="text-[#8a8a80] font-medium">No products in stock right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p, i) => (
            <Motion.div
              key={p._id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              viewport={{ once: true }}
            >
              <Link
                to={`/products/${p._id}`}
                className="block bg-white border border-[#E8E2D8] rounded-card p-4 transition-all duration-400 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/10"
              >
                <div className="aspect-square rounded-2xl bg-border overflow-hidden mb-4">
                  {p.images?.[0]?.url && <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />}
                </div>
                <p className="text-[11px] tracking-[0.12em] uppercase text-[#8a8a80] m-0">{p.category}</p>
                <h3 className="mt-1.5 mb-2 text-[15px] font-semibold text-[#292925] truncate">{p.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-[#292925]">{formatPrice(p.price)}</span>
                  {p.stock <= 0 && <span className="text-[11px] text-[#a8522c] font-semibold">Out of stock</span>}
                </div>
              </Link>
            </Motion.div>
          ))}
        </div>
      )}
    </section>
  );
};

export default StorePreviewSection;
