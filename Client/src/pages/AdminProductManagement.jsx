import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Package, RefreshCw, AlertCircle, X, Upload, ChevronDown } from "lucide-react";
import { getProducts, createProduct, updateProduct, updateProductStock, deleteProduct } from "../api/product.api";
import { formatPrice } from "../utils/priceFormatter";

const CATEGORIES = ["food", "habitat", "accessories", "healthcare", "cleaning", "toys"];
const PETS = ["dog", "cat", "bird", "fish", "snake", "rabbit", "turtle", "mouse", "universal"];

const EMPTY_FORM = {
  name: "", description: "", category: "food", brand: "", price: "",
  stock: "", compatiblePets: [], images: [],
};

// Product Form Modal
const ProductFormModal = ({ product, onSave, onClose }) => {
  const isEdit = !!product;
  const [form, setForm] = useState(isEdit ? {
    ...product,
    price: (product.price / 100).toFixed(2),
    compatiblePets: product.compatiblePets || [],
    images: product.images || [],
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePreviews, setImagePreviews] = useState(
    isEdit ? product.images.map((img) => ({ url: img.url, publicId: img.publicId })) : []
  );
  const [removedPublicIds, setRemovedPublicIds] = useState([]);
  const fileRef = useRef();

  const togglePet = (pet) => {
    setForm((f) => ({
      ...f,
      compatiblePets: f.compatiblePets.includes(pet)
        ? f.compatiblePets.filter((p) => p !== pet)
        : [...f.compatiblePets, pet],
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((f) => ({ url: URL.createObjectURL(f), publicId: null, file: f }));
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  // Existing (server-side) images are marked for removal via removeImageIds;
  // newly-staged local files are simply dropped and their blob URL revoked.
  const removeImage = (i) => {
    setImagePreviews((prev) => {
      const target = prev[i];
      if (target.publicId) {
        setRemovedPublicIds((ids) => [...ids, target.publicId]);
      } else {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((_, idx) => idx !== i);
    });
  };

  // Revoke any still-staged local previews if the modal closes without saving
  const imagePreviewsRef = useRef(imagePreviews);
  useEffect(() => {
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);
  useEffect(() => {
    return () => {
      imagePreviewsRef.current.forEach((p) => p.file && URL.revokeObjectURL(p.url));
    };
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.price || isNaN(parseFloat(form.price))) errs.price = "Valid price required";
    if (!form.stock || isNaN(parseInt(form.stock))) errs.stock = "Valid stock required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("description", form.description.trim());
      fd.append("category", form.category);
      fd.append("brand", form.brand.trim());
      fd.append("price", Math.round(parseFloat(form.price) * 100));
      fd.append("stock", parseInt(form.stock));
      form.compatiblePets.forEach((p) => fd.append("compatiblePets", p));
      imagePreviews.filter((p) => p.file).forEach((p) => fd.append("images", p.file));
      removedPublicIds.forEach((id) => fd.append("removeImageIds", id));

      if (isEdit) {
        await updateProduct(product._id, fd);
      } else {
        await createProduct(fd);
      }
      onSave();
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || "Failed to save product" });
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <Motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[28px] shadow-2xl w-full max-w-2xl my-8 border border-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-7 border-b border-slate-100">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
            {isEdit ? "Edit Product" : "New Product"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-7 space-y-5 max-h-[70vh] overflow-y-auto">
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold border border-rose-100">
              <AlertCircle size={16} /> {errors.submit}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Product Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white ${errors.name ? "border-rose-400" : "border-slate-200"}`}
              placeholder="Premium Dog Food" />
            {errors.name && <p className="text-xs text-rose-500 font-bold mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white resize-none"
              placeholder="Describe this product..." />
          </div>

          {/* Category + Brand */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none capitalize cursor-pointer">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Brand</label>
              <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                placeholder="e.g. Royal Canin" />
            </div>
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Price (USD) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className={`w-full pl-8 pr-4 py-3 rounded-xl border font-semibold text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white ${errors.price ? "border-rose-400" : "border-slate-200"}`}
                  placeholder="9.99" />
              </div>
              {errors.price && <p className="text-xs text-rose-500 font-bold mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Stock Quantity *</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white ${errors.stock ? "border-rose-400" : "border-slate-200"}`}
                placeholder="100" />
              {errors.stock && <p className="text-xs text-rose-500 font-bold mt-1">{errors.stock}</p>}
            </div>
          </div>

          {/* Compatible Pets */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Compatible Pets</label>
            <div className="flex flex-wrap gap-2">
              {PETS.map((pet) => (
                <button key={pet} type="button" onClick={() => togglePet(pet)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize border transition-all ${
                    form.compatiblePets.includes(pet)
                      ? "bg-primary text-white border-primary"
                      : "border-slate-200 text-slate-500 hover:border-primary/40 hover:text-primary"
                  }`}>
                  {pet}
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Product Images</label>
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((img, i) => (
                <div key={img.publicId || img.url} className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 relative group">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    aria-label="Remove image"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-primary hover:text-primary transition-all">
                <Upload size={18} />
                <span className="text-[10px] font-black">Add</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-7 border-t border-slate-100 flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-700 font-black rounded-xl hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 bg-linear-to-br from-primary to-accent text-white font-black rounded-xl shadow-lg shadow-primary/30 hover:scale-[1.01] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : null}
            {isEdit ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </Motion.div>
    </div>
  );
};

// Delete Confirm Modal
const DeleteModal = ({ product, onConfirm, onClose }) => {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[28px] shadow-2xl max-w-md w-full p-8 border border-slate-100">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Trash2 size={28} className="text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 text-center mb-2">Delete Product?</h2>
        <p className="text-slate-500 text-center font-medium mb-1">"{product?.name}"</p>
        <p className="text-slate-400 text-sm text-center mb-6">This action cannot be undone.</p>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-700 font-black rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
          <button onClick={async () => { setDeleting(true); await onConfirm(); }}
            disabled={deleting}
            className="flex-1 py-3 bg-rose-500 text-white font-black rounded-xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/30 disabled:opacity-60 flex items-center justify-center gap-2">
            {deleting ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : null}
            Delete
          </button>
        </div>
      </Motion.div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const AdminProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, admin: true };
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await getProducts(params);
      setProducts(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch { setProducts([]); }
    setLoading(false);
  }, [page, search, category]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSave = async () => {
    setShowForm(false);
    setEditProduct(null);
    await fetchProducts();
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(deleteTarget._id);
      setDeleteTarget(null);
      await fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete");
      setDeleteTarget(null);
    }
  };

  const handleStockUpdate = async (id, stock) => {
    try {
      await updateProductStock(id, stock);
      setProducts((prev) => prev.map((p) => p._id === id ? { ...p, stock } : p));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update stock");
    }
  };

  return (
    <div className="pb-24">
      <AnimatePresence>
        {showForm && (
          <ProductFormModal product={editProduct} onSave={handleSave} onClose={() => { setShowForm(false); setEditProduct(null); }} />
        )}
        {deleteTarget && (
          <DeleteModal product={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Products</h1>
          <p className="text-slate-500 font-medium">{pagination.totalItems || 0} products total</p>
        </div>
        <button onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="btn btn-primary">
          <Plus size={18} /> New Product
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-700 rounded-xl mb-6 border border-rose-100 text-sm font-bold">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError("")} className="ml-auto text-rose-400 hover:text-rose-600"><X size={14} /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (setSearch(searchInput), setPage(1))}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white font-semibold text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer capitalize">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={fetchProducts} className="p-3 bg-white border border-slate-200 rounded-xl text-primary hover:bg-primary/10 transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24">
          <Package size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="font-black text-slate-900">No products found</p>
          <button onClick={() => { setEditProduct(null); setShowForm(true); }} className="btn btn-primary mt-4">
            <Plus size={16} /> Add First Product
          </button>
        </div>
      ) : (
        <div className="glass-card bg-white border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Product", "Category", "Price", "Stock", "Sold", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 px-5 py-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                          {p.images?.[0]?.url ? (
                            <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-slate-300" /></div>}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm max-w-[180px] truncate">{p.name}</p>
                          {p.brand && <p className="text-xs text-slate-400 font-bold">{p.brand}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-wider">{p.category}</span>
                    </td>
                    <td className="px-5 py-4 font-black text-slate-900">{formatPrice(p.price)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleStockUpdate(p._id, Math.max(0, p.stock - 1))} className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-xs font-black hover:bg-rose-100 hover:text-rose-600 transition-all">-</button>
                        <span className={`font-black text-sm w-8 text-center ${p.stock === 0 ? "text-rose-600" : p.stock <= 5 ? "text-amber-600" : "text-slate-900"}`}>{p.stock}</span>
                        <button onClick={() => handleStockUpdate(p._id, p.stock + 1)} className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-xs font-black hover:bg-emerald-100 hover:text-emerald-600 transition-all">+</button>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-600 text-sm">{p.soldCount || 0}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${p.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditProduct(p); setShowForm(true); }} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-primary/10 hover:text-primary transition-all">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(p)} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-5 border-t border-slate-100">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${page === i + 1 ? "bg-primary text-white shadow-lg" : "border border-slate-200 text-slate-500 hover:border-primary hover:text-primary"}`}>
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

export default AdminProductManagement;
