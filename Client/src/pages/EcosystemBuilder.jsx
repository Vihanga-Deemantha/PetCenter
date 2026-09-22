import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, ChevronDown, ChevronUp, AlertTriangle, Package, Save, ShoppingCart, X, Sparkles } from "lucide-react";
import { getPetConfig, createBuild, bulkAddToCart, narrateBuild } from "../api/ecosystem.api";
import { getProducts } from "../api/product.api";
import { useBuilder } from "../context/BuilderContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { PET_ICONS } from "./EcosystemPicker";
import StepIndicator from "../components/ecosystem/StepIndicator";
import { formatPrice } from "../utils/priceFormatter";

export default function EcosystemBuilder() {
  const { petType } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { fetchCart } = useCart();
  const { petType: contextPetType, selections, toggleSelection, getTotalPrice, getMissingRequired, isReadyToAddCart, getSelectedItems, totalItemCount, clearSelections, setPet } = useBuilder();

  const step = parseInt(searchParams.get("step") || "2");

  // Only present right after "Suggest a build" on the picker page hands off
  // here via navigation state — lost on a hard refresh, which is fine, it's
  // purely an explanatory overlay on top of the real selection state below.
  const suggestion = location.state?.suggestion;
  const [showSuggestionBanner, setShowSuggestionBanner] = useState(!!suggestion);
  const suggestedProductIds = useMemo(() => new Set(suggestion?.productIds?.map(String) || []), [suggestion]);
  const [narration, setNarration] = useState(null); // { narration, source } | null
  const [narrating, setNarrating] = useState(false);
  const [narrateError, setNarrateError] = useState("");

  const [petConfig, setPetConfig] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openCategories, setOpenCategories] = useState({});
  const [toast, setToast] = useState(null);
  const [buildName, setBuildName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (!petType) return;
    document.title = `Build a ${petType} setup | PetCenter`;
    setLoading(true);
    setError(null);
    // Skip the reset if the context is already on this pet type — arriving
    // here via loadBuild() (a saved build, or a budget suggestion) already
    // set the right petType + selections just before this mounted; calling
    // setPet again would wipe them back to empty immediately after.
    if (contextPetType !== petType) {
      setPet(petType);
    }

    Promise.all([getPetConfig(petType), getProducts({ compatiblePets: petType, limit: 200, inStock: "false" })])
      .then(([configRes, productsRes]) => {
        const config = configRes.data.data;
        setPetConfig(config);
        setAllProducts(productsRes.data.data || []);
        const expanded = {};
        config.categories.forEach((cat) => {
          if (cat.required) expanded[cat.key] = true;
        });
        setOpenCategories(expanded);
      })
      .catch(() => setError("Failed to load builder data. Please refresh."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petType]);

  useEffect(() => {
    if (!searchParams.get("step")) setSearchParams({ step: "2" }, { replace: true });
  }, [searchParams, setSearchParams]);

  const productMap = useMemo(() => {
    const map = {};
    allProducts.forEach((p) => { map[p._id] = p; });
    return map;
  }, [allProducts]);

  const getProductsForCategory = (categoryKey) => allProducts.filter((p) => p.tags?.includes(categoryKey));

  const liveTotal = getTotalPrice(productMap);
  const missingRequired = petConfig ? getMissingRequired(petConfig) : [];
  const canAddToCart = isReadyToAddCart(petConfig);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Narrates the LIVE current selection, not the original suggestion — if
  // the user swapped an item out, the explanation should describe what's
  // actually in the build now, not a stale pick.
  const handleExplainBuild = async () => {
    if (!petConfig) return;
    const items = petConfig.categories.flatMap((cat) =>
      (selections[cat.key] || [])
        .map((productId) => productMap[productId])
        .filter(Boolean)
        .map((product) => ({ category: cat.label, name: product.name, price: product.price }))
    );
    if (items.length === 0) {
      setNarrateError("Select at least one item first.");
      return;
    }
    setNarrating(true);
    setNarrateError("");
    try {
      const res = await narrateBuild({
        petType,
        budget: suggestion?.budget,
        totalPrice: liveTotal,
        overBudget: suggestion?.overBudget,
        notes: suggestion?.notes,
        items,
      });
      setNarration(res.data.data);
    } catch {
      setNarrateError("Couldn't generate an explanation right now. Please try again.");
    } finally {
      setNarrating(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/ecosystem/build/${petType}?step=3`)}`);
      return;
    }
    setCartLoading(true);
    try {
      const items = getSelectedItems();
      const res = await bulkAddToCart(items);
      const { added, failed } = res.data.data;
      await fetchCart();
      // Only clear what actually made it into the cart — if everything failed
      // (e.g. the whole build sold out), wiping selections here would lose
      // the user's whole build with nothing to show for it.
      if (added.length > 0) clearSelections();
      if (failed.length === 0) showToast(`${added.length} items added to your cart.`);
      else showToast(`${added.length} added. ${failed.length} out of stock: ${failed.map((f) => f.name || f.productId).join(", ")}`, "warning");
    } catch {
      showToast("Failed to add items to cart. Please try again.", "error");
    } finally {
      setCartLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/ecosystem/build/${petType}?step=3`)}`);
      return;
    }
    if (!buildName.trim() || saveLoading) return;
    setSaveLoading(true);
    try {
      const items = getSelectedItems();
      const selPayload = items.map((item) => ({
        productId: item.productId,
        categoryKey: Object.entries(selections).find(([, ids]) => ids.includes(item.productId))?.[0],
      }));
      await createBuild({ name: buildName.trim(), petType, selections: selPayload });
      setShowSaveModal(false);
      setBuildName("");
      showToast("Build saved — view it in My Builds.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save build.", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return <BuilderSkeleton />;
  if (error)
    return (
      <div className="max-w-7xl mx-auto px-7 py-16 text-center text-[#8f4a28]">{error}</div>
    );
  if (!petConfig) return null;

  const icon = PET_ICONS[petType] || "🐾";

  return (
    <div className="max-w-7xl mx-auto px-7 pt-8 pb-24">
      <button onClick={() => navigate("/ecosystem")} className="flex items-center gap-1.5 text-secondary text-sm font-medium mb-3.5">
        <ArrowLeft size={15} /> Back to pet picker
      </button>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-3xl leading-none">{icon}</span>
        <h1 className="font-heading text-[26px] sm:text-[32px] font-medium m-0 tracking-tight">{petConfig.displayName} setup builder</h1>
      </div>
      <StepIndicator currentStep={step} />

      {step === 2 && <Step2Requirements petConfig={petConfig} onStart={() => setSearchParams({ step: "3" })} onChangePet={() => navigate("/ecosystem")} />}

      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-7 items-start">
          <div className="min-w-0">
            {showSuggestionBanner && suggestion && (
              <SuggestionBanner
                suggestion={suggestion}
                onDismiss={() => setShowSuggestionBanner(false)}
                narration={narration}
                narrating={narrating}
                narrateError={narrateError}
                onExplain={handleExplainBuild}
              />
            )}
            {petConfig.categories.map((cat) => {
              const products = getProductsForCategory(cat.key);
              const selected = selections[cat.key] || [];
              const isOpen = openCategories[cat.key];
              const isMissing = cat.required && selected.length === 0;
              return (
                <CategoryCard
                  key={cat.key}
                  category={cat}
                  products={products}
                  selected={selected}
                  isOpen={isOpen}
                  isMissing={isMissing}
                  suggestedProductIds={suggestedProductIds}
                  onToggleOpen={() => setOpenCategories((prev) => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                  onToggleProduct={(productId) => toggleSelection(cat.key, productId, cat.maxSelectable)}
                />
              );
            })}
          </div>

          <div className="lg:sticky lg:top-28">
            <SummaryPanel
              liveTotal={liveTotal}
              totalItemCount={totalItemCount}
              missingRequired={missingRequired}
              canAddToCart={canAddToCart}
              cartLoading={cartLoading}
              onAddToCart={handleAddToCart}
              onSave={() => { setShowSaveModal(true); setBuildName(`My ${petConfig.displayName} Setup`); }}
              petConfig={petConfig}
              user={user}
            />
          </div>
        </div>
      )}

      {showSaveModal && <SaveModal value={buildName} onChange={setBuildName} onSave={handleSave} onClose={() => setShowSaveModal(false)} loading={saveLoading} />}

      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>
    </div>
  );
}

// ─── Step 2: Requirements overview ───────────────────────────────────────────
function Step2Requirements({ petConfig, onStart, onChangePet }) {
  const { habitat, categories, tips, description } = petConfig;
  const required = categories.filter((c) => c.required);
  const optional = categories.filter((c) => !c.required);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-7">
      <div>
        <div className="bg-secondary text-light rounded-2xl px-7 py-6 mb-6">
          <p className="m-0 text-[15px] leading-relaxed text-[#EDEFE8]">{description}</p>
        </div>

        {habitat && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {habitat.tankSizeMin && <StatCard label="Min size" value={`${habitat.tankSizeMin}L`} />}
            {habitat.temperatureRange && <StatCard label="Temperature" value={`${habitat.temperatureRange.min}–${habitat.temperatureRange.max}°C`} />}
            {habitat.humidityRange && <StatCard label="Humidity" value={`${habitat.humidityRange.min}–${habitat.humidityRange.max}%`} />}
            {habitat.lightingHours > 0 && <StatCard label="Light/day" value={`${habitat.lightingHours}h`} />}
            {habitat.uvRequired && <StatCard label="UV-B" value="Required" highlight />}
          </div>
        )}

        <h3 className="font-heading text-xl font-medium mb-3.5">What you'll build</h3>
        {required.length > 0 && (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-2">Required</p>
            {required.map((cat) => (
              <ChecklistItem key={cat.key} label={cat.label} description={cat.description} required />
            ))}
          </>
        )}
        {optional.length > 0 && (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a80] mt-4.5 mb-2">Optional</p>
            {optional.map((cat) => (
              <ChecklistItem key={cat.key} label={cat.label} description={cat.description} />
            ))}
          </>
        )}

        <div className="flex gap-3 mt-6.5">
          <button onClick={onStart} className="btn btn-primary px-7 py-3.25">
            Start building →
          </button>
          <button onClick={onChangePet} className="btn bg-light text-[#4F5B4B] hover:bg-border px-5 py-3.25">
            Change pet
          </button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">💡 Care tips</h3>
        {tips?.map((tip, i) => (
          <div key={i} className="flex gap-2.5 mb-3.5 text-[13px] text-[#5c5c54] leading-relaxed">
            <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`rounded-xl p-3.5 text-center border ${highlight ? "bg-[#F7E9DF] border-[#f0d9c8]" : "bg-white border-border"}`}>
      <p className={`m-0 text-[11px] font-semibold uppercase tracking-wider ${highlight ? "text-[#8f4a28]" : "text-[#8a8a80]"}`}>{label}</p>
      <p className={`m-0 mt-1 text-sm font-semibold ${highlight ? "text-[#8f4a28]" : "text-[#292925]"}`}>{value}</p>
    </div>
  );
}

function ChecklistItem({ label, description, required }) {
  return (
    <div className="flex gap-2.5 py-2.5 border-b border-border items-start">
      <span className={`text-sm mt-0.5 shrink-0 ${required ? "text-primary" : "text-[#a8a49a]"}`}>{required ? "●" : "○"}</span>
      <div>
        <div className="text-[13.5px] font-semibold text-[#292925]">{label}</div>
        <div className="text-xs text-[#8a8a80] mt-0.5">{description}</div>
      </div>
    </div>
  );
}

// ─── Suggestion banner ────────────────────────────────────────────────────────
// Only shown right after "Suggest a build" on the picker page. Always states
// the real budget outcome — including going over budget — rather than
// glossing over it.
function SuggestionBanner({ suggestion, onDismiss, narration, narrating, narrateError, onExplain }) {
  const { budget, totalPrice, overBudget, notes } = suggestion;
  return (
    <Motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-accent/10 border border-accent/25 rounded-2xl p-5 mb-5 relative">
      <button onClick={onDismiss} className="absolute top-4 right-4 text-[#8a8a80] hover:text-[#292925]" aria-label="Dismiss">
        <X size={16} />
      </button>
      <div className="flex items-center gap-2 mb-1.5 pr-6">
        <Sparkles size={16} className="text-accent shrink-0" />
        <p className="m-0 font-semibold text-[#292925] text-sm">Suggested for a {formatPrice(budget)} budget</p>
      </div>
      <p className="m-0 text-[13px] text-[#5c5c54] leading-relaxed">
        {overBudget
          ? `This came to ${formatPrice(totalPrice)} — a little over, to make sure every required essential is included.`
          : `This came to ${formatPrice(totalPrice)}, within budget.`}{" "}
        Swap anything below before you save or buy.
      </p>
      {notes?.length > 0 && (
        <ul className="mt-2.5 mb-0 pl-4 space-y-1">
          {notes.map((note, i) => (
            <li key={i} className="text-[12px] text-[#8a8a80]">{note}</li>
          ))}
        </ul>
      )}

      {narration ? (
        <div className="mt-3.5 pt-3.5 border-t border-accent/20">
          <p className="m-0 text-[13px] text-[#292925] leading-relaxed italic">"{narration.narration}"</p>
        </div>
      ) : (
        <button
          onClick={onExplain}
          disabled={narrating}
          className="mt-3.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-secondary hover:text-primary transition-colors disabled:opacity-60"
        >
          <Sparkles size={12} /> {narrating ? "Thinking…" : "Explain this build"}
        </button>
      )}
      {narrateError && <p className="mt-2 mb-0 text-[12px] text-[#b4573a]">{narrateError}</p>}
    </Motion.div>
  );
}

// ─── Category card (layer) ────────────────────────────────────────────────────
function CategoryCard({ category, products, selected, isOpen, isMissing, suggestedProductIds, onToggleOpen, onToggleProduct }) {
  const selectedProducts = products.filter((p) => selected.includes(p._id));
  const hasOutOfStockSelection = selectedProducts.some((p) => p.stock === 0);

  return (
    <div className={`bg-white rounded-2xl mb-3.5 overflow-hidden border transition-colors ${isMissing ? "border-[#e3b09a]" : "border-border"}`}>
      <button onClick={onToggleOpen} className="w-full px-5 py-4 flex items-center gap-2.5 text-left">
        {isOpen ? <ChevronUp size={17} className="text-[#8a8a80]" /> : <ChevronDown size={17} className="text-[#8a8a80]" />}
        <span className="font-semibold text-[#292925] text-[14.5px] flex-1">{category.label}</span>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${category.required ? "bg-accent/10 text-secondary" : "bg-border text-[#6e6e64]"}`}>{category.required ? "Required" : "Optional"}</span>
        <span className={`text-xs font-semibold ${selected.length > 0 ? "text-[#40543C]" : "text-[#a8a49a]"}`}>
          {selected.length}/{category.maxSelectable}
        </span>
        {hasOutOfStockSelection && (
          <span className="text-[10px] font-semibold bg-[#F7E9DF] text-[#8f4a28] px-2 py-0.5 rounded-md flex items-center gap-1" title="One of your saved items is out of stock">
            <AlertTriangle size={10} /> Out of stock
          </span>
        )}
        {isMissing && <AlertTriangle size={15} className="text-[#b4573a]" />}
      </button>

      {isOpen && (
        <div className="px-5 pb-5">
          <p className="text-xs text-[#8a8a80] mb-3">{category.description}</p>
          {products.length === 0 ? (
            <div className="text-center py-6 bg-light rounded-xl text-[#a8a49a] text-[13px]">No {category.label.toLowerCase()} products available yet</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {products.map((product) => (
                <BuilderProductCard
                  key={product._id}
                  product={product}
                  isSelected={selected.includes(product._id)}
                  isSuggested={suggestedProductIds?.has(product._id)}
                  onToggle={() => onToggleProduct(product._id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BuilderProductCard({ product, isSelected, isSuggested, onToggle }) {
  const outOfStock = product.stock === 0;
  return (
    <button
      onClick={outOfStock && !isSelected ? undefined : onToggle}
      disabled={outOfStock && !isSelected}
      title={outOfStock ? "Out of stock" : product.name}
      className={`text-left rounded-xl p-2.5 border transition-colors ${isSelected ? "bg-accent/10 border-accent" : outOfStock ? "bg-light border-border opacity-55 cursor-not-allowed" : "bg-white border-border hover:border-[#cfc8ba]"}`}
    >
      <div className="relative aspect-square rounded-lg overflow-hidden bg-light mb-2">
        {product.images?.[0]?.url ? (
          <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={22} className="text-[#c9c2b3]" />
          </div>
        )}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-5.5 h-5.5 rounded-full bg-accent flex items-center justify-center">
            <Check size={12} className="text-white" strokeWidth={3} />
          </div>
        )}
        {outOfStock && <div className="absolute bottom-0 inset-x-0 bg-[#292925]/70 text-white text-[9px] font-semibold py-0.75 text-center">OUT OF STOCK</div>}
      </div>
      {isSelected && isSuggested && (
        <div className="inline-flex items-center gap-1 mb-1 text-[9.5px] font-semibold text-accent uppercase tracking-wide">
          <Sparkles size={9} /> Suggested
        </div>
      )}
      <div className={`text-[12px] font-medium leading-tight line-clamp-2 mb-1 ${isSelected ? "text-secondary" : "text-[#292925]"}`}>{product.name}</div>
      <div className={`text-[13px] font-semibold ${isSelected ? "text-secondary" : "text-primary"}`}>{formatPrice(product.price)}</div>
    </button>
  );
}

// ─── Summary panel ────────────────────────────────────────────────────────────
function SummaryPanel({ liveTotal, totalItemCount, missingRequired, canAddToCart, cartLoading, onAddToCart, onSave, petConfig, user }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      <h3 className="text-[15px] font-semibold mb-4">Your build summary</h3>

      <div className="bg-light rounded-xl p-4 mb-4 text-center">
        <p className="m-0 text-xs font-semibold text-accent">Live total</p>
        <p className="m-0 mt-1 font-heading text-[28px]">{formatPrice(liveTotal)}</p>
        <p className="m-0 mt-0.5 text-xs text-[#8a8a80]">
          {totalItemCount} item{totalItemCount !== 1 ? "s" : ""} selected
        </p>
      </div>

      {missingRequired.length > 0 && (
        <div className="bg-[#F7E9DF] border border-[#f0d9c8] rounded-xl p-3.5 mb-4">
          <p className="m-0 text-xs font-semibold text-[#8f4a28] mb-1.5">Still needed:</p>
          {missingRequired.map((key) => {
            const cat = petConfig?.categories.find((c) => c.key === key);
            return (
              <p key={key} className="m-0 text-xs text-[#8f4a28] mb-0.5">
                • {cat?.label || key}
              </p>
            );
          })}
        </div>
      )}

      <button onClick={onAddToCart} disabled={!canAddToCart || cartLoading} className={`btn w-full py-3.25 mb-2.5 ${canAddToCart ? "btn-primary" : "bg-border text-[#a8a49a] cursor-not-allowed"}`}>
        {cartLoading ? "Adding..." : !user ? "Login to add to cart" : (
          <>
            <ShoppingCart size={16} /> Add all to cart
          </>
        )}
      </button>

      <button onClick={onSave} className="btn w-full bg-light text-[#4F5B4B] hover:bg-border py-3">
        <Save size={15} /> Save build
      </button>
    </div>
  );
}

// ─── Save modal ───────────────────────────────────────────────────────────────
function SaveModal({ value, onChange, onSave, onClose, loading }) {
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292925]/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[26px] p-8 max-w-95 w-full shadow-2xl border border-border">
        <h3 className="font-heading text-xl mb-1.5">Name your build</h3>
        <p className="text-sm text-[#8a8a80] mb-5">Give it a name so you can recognise it later.</p>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={60}
          placeholder="e.g. My Ball Python Setup"
          onKeyDown={(e) => { if (e.key === "Enter") onSave(); }}
          className="w-full border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-accent mb-5"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-light text-[#4F5B4B] rounded-full font-medium hover:bg-border transition-colors">
            Cancel
          </button>
          <button onClick={onSave} disabled={!value.trim() || loading} className="flex-1 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Saving..." : "Save build"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  const style = type === "error" ? { bg: "#F7E9DF", color: "#8f4a28" } : type === "warning" ? { bg: "#F7E9DF", color: "#8f4a28" } : { bg: "#E9EDE4", color: "#40543C" };
  return (
    <Motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-120 rounded-full px-5 py-3.25 text-sm font-medium max-w-[90vw] shadow-xl"
      style={{ background: style.bg, color: style.color }}
    >
      {msg}
    </Motion.div>
  );
}

function BuilderSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-7 pt-8 pb-24">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-border rounded-2xl mb-3 animate-pulse" />
      ))}
    </div>
  );
}
