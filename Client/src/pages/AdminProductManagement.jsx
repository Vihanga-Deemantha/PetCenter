import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Package, RefreshCw, AlertCircle, X, Upload } from "lucide-react";
import { getProducts, createProduct, updateProduct, updateProductStock, deleteProduct } from "../api/product.api";
import { formatPrice } from "../utils/priceFormatter";

const CATEGORIES = ["food", "habitat", "accessories", "healthcare", "cleaning", "toys"];
const PETS = ["dog", "cat", "bird", "fish", "snake", "spider", "rabbit", "turtle", "mouse", "reptile", "amphibian", "universal"];

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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#292925]/40 backdrop-blur-sm p-4 overflow-y-auto">
      <Motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-light rounded-[26px] shadow-2xl w-full max-w-2xl my-8 border border-[#dcd4c6]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6.5 border-b border-border">
          <h2 className="font-heading text-2xl font-medium text-[#292925]">
            {isEdit ? "Edit product" : "New product"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-[#8a8a80] hover:bg-border transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6.5 space-y-5 max-h-[70vh] overflow-y-auto">
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">
              <AlertCircle size={16} /> {errors.submit}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-2">Product name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white ${errors.name ? "border-rose-400" : "border-border focus:border-accent"}`}
              placeholder="Premium Dog Food" />
            {errors.name && <p className="text-xs text-rose-500 font-medium mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-2">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border focus:border-accent text-sm outline-none bg-white resize-none"
              placeholder="Describe this product..." />
          </div>

          {/* Category + Brand */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-2">Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border font-medium text-sm bg-white outline-none focus:border-accent capitalize cursor-pointer">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-2">Brand</label>
              <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border focus:border-accent text-sm outline-none bg-white"
                placeholder="e.g. Royal Canin" />
            </div>
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-2">Price (USD) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8a80] font-semibold">$</span>
                <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className={`w-full pl-8 pr-4 py-3 rounded-xl border text-sm outline-none bg-white ${errors.price ? "border-rose-400" : "border-border focus:border-accent"}`}
                  placeholder="9.99" />
              </div>
              {errors.price && <p className="text-xs text-rose-500 font-medium mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-2">Stock quantity *</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white ${errors.stock ? "border-rose-400" : "border-border focus:border-accent"}`}
                placeholder="100" />
              {errors.stock && <p className="text-xs text-rose-500 font-medium mt-1">{errors.stock}</p>}
            </div>
          </div>

          {/* Compatible Pets */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-2">Compatible pets</label>
            <div className="flex flex-wrap gap-2">
              {PETS.map((pet) => (
                <button key={pet} type="button" onClick={() => togglePet(pet)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-all ${
                    form.compatiblePets.includes(pet)
                      ? "bg-primary text-white border-primary"
                      : "border-border text-[#6e6e64] hover:border-accent hover:text-primary"
                  }`}>
                  {pet}
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-2">Product images</label>
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((img, i) => (
                <div key={img.publicId || img.url} className="w-20 h-20 rounded-xl overflow-hidden border border-border relative group">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute inset-0 bg-[#292925]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    aria-label="Remove image"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-[#cfc8ba] flex flex-col items-center justify-center gap-1 text-[#8a8a80] hover:border-primary hover:text-primary transition-all">
                <Upload size={18} />
                <span className="text-[10px] font-semibold">Add</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6.5 border-t border-border flex gap-3.5">
          <button onClick={onClose} className="flex-1 py-3 bg-border text-secondary font-medium rounded-full hover:bg-[#ded6c8] transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 bg-linear-to-br from-primary to-accent text-white font-medium rounded-full hover:scale-[1.01] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <div className="w-4.5 h-4.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : null}
            {isEdit ? "Save changes" : "Create product"}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292925]/40 backdrop-blur-sm p-4">
      <Motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[26px] shadow-2xl max-w-md w-full p-8 border border-border">
        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Trash2 size={24} className="text-rose-500" />
        </div>
        <h2 className="font-heading text-2xl font-medium text-[#292925] text-center mb-2">Delete product?</h2>
        <p className="text-[#5c5c54] text-center font-medium mb-1">"{product?.name}"</p>
        <p className="text-[#8a8a80] text-sm text-center mb-6">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-light text-secondary font-medium rounded-full hover:bg-border transition-colors">Cancel</button>
          <button onClick={async () => { setDeleting(true); await onConfirm(); }}
            disabled={deleting}
            className="flex-1 py-3 bg-rose-500 text-white font-medium rounded-full hover:bg-rose-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
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
  const [stockUpdating, setStockUpdating] = useState(new Set());

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
    // Guards against rapid +/- double-clicks: each click computes the new
    // value from `p.stock` captured in that render's closure, so two clicks
    // before the first response lands both compute e.g. 10+1=11 instead of
    // 11 then 12, and both requests set stock to 11 — silently dropping one
    // increment. Blocking a second update while one is in flight fixes it.
    if (stockUpdating.has(id)) return;
    setStockUpdating((prev) => new Set(prev).add(id));
    try {
      await updateProductStock(id, stock);
      setProducts((prev) => prev.map((p) => p._id === id ? { ...p, stock } : p));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update stock");
    } finally {
      setStockUpdating((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
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
      <div className="flex items-center justify-between mb-7 flex-wrap gap-4 pb-7 border-b border-border">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-2.5">Admin</p>
          <h1 className="font-heading text-[32px] font-medium tracking-tight text-[#292925]">Products</h1>
          <p className="text-[#6e6e64] mt-1">{pagination.totalItems || 0} products total</p>
        </div>
        <button onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="btn btn-primary">
          <Plus size={18} /> New product
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-700 rounded-xl mb-6 text-sm font-medium">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError("")} className="ml-auto text-rose-400 hover:text-rose-600"><X size={14} /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-7">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8a80]" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (setSearch(searchInput), setPage(1))}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.75 rounded-xl border border-border bg-white focus:border-accent text-sm outline-none" />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-4 py-2.75 rounded-xl border border-border bg-white font-medium text-sm text-[#3f3f38] outline-none focus:border-accent cursor-pointer capitalize">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={fetchProducts} className="p-2.75 bg-white border border-border rounded-xl text-primary hover:bg-primary/10 transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-border rounded-2xl animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24">
          <Package size={44} className="mx-auto mb-4 text-[#c9c2b3]" />
          <p className="font-semibold text-[#292925]">No products found</p>
          <button onClick={() => { setEditProduct(null); setShowForm(true); }} className="btn btn-primary mt-4">
            <Plus size={16} /> Add first product
          </button>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-[22px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Product", "Category", "Price", "Stock", "Sold", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#8a8a80] px-5 py-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-light/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-light shrink-0">
                          {p.images?.[0]?.url ? (
                            <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-[#c9c2b3]" /></div>}
                        </div>
                        <div>
                          <p className="font-semibold text-[#292925] text-sm max-w-[180px] truncate">{p.name}</p>
                          {p.brand && <p className="text-xs text-[#8a8a80]">{p.brand}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-semibold uppercase tracking-wider">{p.category}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#292925]">{formatPrice(p.price)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleStockUpdate(p._id, Math.max(0, p.stock - 1))} disabled={stockUpdating.has(p._id)} className="w-6 h-6 rounded-lg bg-border text-[#5c5c54] text-xs font-semibold hover:bg-rose-100 hover:text-rose-600 transition-all disabled:opacity-40">-</button>
                        <span className={`font-semibold text-sm w-8 text-center ${p.stock === 0 ? "text-rose-600" : p.stock <= 5 ? "text-[#8f4a28]" : "text-[#292925]"}`}>{p.stock}</span>
                        <button onClick={() => handleStockUpdate(p._id, p.stock + 1)} disabled={stockUpdating.has(p._id)} className="w-6 h-6 rounded-lg bg-border text-[#5c5c54] text-xs font-semibold hover:bg-[#E9EDE4] hover:text-[#40543C] transition-all disabled:opacity-40">+</button>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-[#5c5c54] text-sm">{p.soldCount || 0}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${p.isActive ? "bg-[#E9EDE4] text-[#40543C]" : "bg-[#EFEBE2] text-[#6e6e64]"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditProduct(p); setShowForm(true); }} className="p-2 rounded-xl bg-light text-[#6e6e64] hover:bg-primary/10 hover:text-primary transition-all">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(p)} className="p-2 rounded-xl bg-light text-[#6e6e64] hover:bg-rose-50 hover:text-rose-500 transition-all">
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

export default AdminProductManagement;
