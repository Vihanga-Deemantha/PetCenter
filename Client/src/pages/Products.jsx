import React, { useState, useEffect } from "react";
import { getProducts } from "../services/productService";
import { motion as Motion } from "framer-motion";
import { ShoppingCart, Star, Package } from "lucide-react";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data.data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="products-page pb-24 px-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 py-8 border-b border-slate-200 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">Premium Pet Store</h1>
          <p className="text-slate-500 text-lg font-medium">Shop the best quality supplies for your furry (or scaly) friends.</p>
        </div>
        <div className="px-5 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Package size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exclusive Goods</p>
            <p className="text-slate-900 font-bold leading-tight">Verified Quality</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-40">
          <Motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <ShoppingCart size={48} className="text-primary/20" />
          </Motion.div>
          <p className="mt-6 text-slate-400 font-bold text-lg">Fetching premium supplies...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
              <Package size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold">No products available yet. Check back soon!</p>
            </div>
          ) : (
            products.map((product, index) => (
              <Motion.div 
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8 }}
                className="glass-card overflow-hidden bg-white border-slate-100 shadow-sm transition-all group"
              >
                <div className="relative h-60 overflow-hidden">
                  <img 
                    src={product.image || "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1000"} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary shadow-lg border border-white/20">
                      {product.category}
                    </span>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-black tracking-widest uppercase">4.8</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-6 group-hover:text-primary transition-colors leading-tight">{product.name}</h3>
                  <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">${product.price}</span>
                    <button className="p-3 bg-primary text-white rounded-xl hover:bg-black transition-all shadow-lg shadow-indigo-500/20">
                      <ShoppingCart size={20} />
                    </button>
                  </div>
                </div>
              </Motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Products;
