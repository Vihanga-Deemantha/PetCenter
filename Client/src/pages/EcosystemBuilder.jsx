import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getPetConfig } from "../api/ecosystem.api";
import { getProducts } from "../api/product.api";
import { createBuild } from "../api/ecosystem.api";
import { bulkAddToCart } from "../api/ecosystem.api";
import { useBuilder } from "../context/BuilderContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { StepIndicator, PET_ICONS } from "./EcosystemPicker";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatPrice = (cents) =>
  cents === 0 ? "$0.00" : `$${(cents / 100).toFixed(2)}`;

export default function EcosystemBuilder() {
  const { petType } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchCart } = useCart();
  const {
    selections,
    toggleSelection,
    getTotalPrice,
    getMissingRequired,
    isReadyToAddCart,
    getSelectedItems,
    totalItemCount,
    clearSelections,
    setPet,
  } = useBuilder();

  const step = parseInt(searchParams.get("step") || "2");

  const [petConfig, setPetConfig] = useState(null);
  const [allProducts, setAllProducts] = useState([]);   // all products for this petType
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [openCategories, setOpenCategories] = useState({});
  const [toast, setToast] = useState(null);
  const [buildName, setBuildName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Fetch config + products once
  useEffect(() => {
    if (!petType) return;
    document.title = `Build a ${petType} Setup | PetCenter`;
    setLoading(true);
    setError(null);

    // Sync context pet type
    setPet(petType);

    Promise.all([
      getPetConfig(petType),
      getProducts({ compatiblePets: petType, limit: 200, inStock: "false" }),
    ])
      .then(([configRes, productsRes]) => {
        const config = configRes.data.data;
        setPetConfig(config);
        setAllProducts(productsRes.data.data || []);

        // Expand required categories by default
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

  // Redirect if no step
  useEffect(() => {
    if (!searchParams.get("step")) {
      setSearchParams({ step: "2" }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Build a product lookup map for price calculations
  const productMap = useMemo(() => {
    const map = {};
    allProducts.forEach((p) => { map[p._id] = p; });
    return map;
  }, [allProducts]);

  // Get products for a specific category key
  const getProductsForCategory = (categoryKey) =>
    allProducts.filter((p) => p.tags?.includes(categoryKey));

  // Live total price
  const liveTotal = getTotalPrice(productMap);
  const missingRequired = petConfig ? getMissingRequired(petConfig) : [];
  const canAddToCart = isReadyToAddCart(petConfig);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  // ── Add all to cart ────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!user) {
      navigate(`/login?redirect=/ecosystem/build/${petType}?step=3`);
      return;
    }
    setCartLoading(true);
    try {
      const items = getSelectedItems();
      const res = await bulkAddToCart(items);
      const { added, failed } = res.data.data;
      await fetchCart();
      clearSelections();
      if (failed.length === 0) {
        showToast(`🎉 ${added.length} items added to your cart!`);
      } else {
        showToast(
          `✅ ${added.length} items added. ⚠️ ${failed.length} out of stock: ${failed.map((f) => f.name || f.productId).join(", ")}`,
          "warning"
        );
      }
    } catch {
      showToast("Failed to add items to cart. Please try again.", "error");
    } finally {
      setCartLoading(false);
    }
  };

  // ── Save build ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) {
      navigate(`/login?redirect=/ecosystem/build/${petType}?step=3`);
      return;
    }
    if (!buildName.trim()) return;
    setSaveLoading(true);
    try {
      const items = getSelectedItems();
      const selPayload = items.map((item) => ({
        productId: item.productId,
        categoryKey: Object.entries(selections).find(([, ids]) =>
          ids.includes(item.productId)
        )?.[0],
      }));
      await createBuild({ name: buildName.trim(), petType, selections: selPayload });
      setShowSaveModal(false);
      setBuildName("");
      showToast("✅ Build saved! View it in My Builds.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save build.", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return <BuilderSkeleton />;
  if (error) return (
    <div style={{ textAlign: "center", padding: 48, color: "#c62828" }}>{error}</div>
  );
  if (!petConfig) return null;

  const icon = PET_ICONS[petType] || "🐾";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate("/ecosystem")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#7c3aed",
            fontSize: 14,
            fontWeight: 600,
            padding: 0,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ← Back to pet picker
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 36 }}>{icon}</span>
          <h1 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, color: "#1a1a1a", margin: 0 }}>
            {petConfig.displayName} Setup Builder
          </h1>
        </div>
        <StepIndicator currentStep={step} />
      </div>

      {/* ── STEP 2: Requirements Overview ─────────────────────────────────── */}
      {step === 2 && (
        <Step2Requirements
          petConfig={petConfig}
          onStart={() => setSearchParams({ step: "3" })}
          onChangePet={() => navigate("/ecosystem")}
        />
      )}

      {/* ── STEP 3: Product Selection ──────────────────────────────────────── */}
      {step === 3 && (
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          {/* Left: Accordion */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {petConfig.categories.map((cat) => {
              const products = getProductsForCategory(cat.key);
              const selected = selections[cat.key] || [];
              const isOpen = openCategories[cat.key];
              const isMissing = cat.required && selected.length === 0;

              return (
                <CategoryAccordion
                  key={cat.key}
                  category={cat}
                  products={products}
                  selected={selected}
                  isOpen={isOpen}
                  isMissing={isMissing}
                  onToggleOpen={() =>
                    setOpenCategories((prev) => ({ ...prev, [cat.key]: !prev[cat.key] }))
                  }
                  onToggleProduct={(productId) =>
                    toggleSelection(cat.key, productId, cat.maxSelectable)
                  }
                />
              );
            })}
          </div>

          {/* Right: Summary Panel (desktop) */}
          <div style={{
            width: 300,
            flexShrink: 0,
            position: "sticky",
            top: 100,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}>
            <SummaryPanel
              liveTotal={liveTotal}
              totalItemCount={totalItemCount}
              missingRequired={missingRequired}
              canAddToCart={canAddToCart}
              cartLoading={cartLoading}
              saveLoading={saveLoading}
              onAddToCart={handleAddToCart}
              onSave={() => { setShowSaveModal(true); setBuildName(`My ${petConfig.displayName} Setup`); }}
              petConfig={petConfig}
              user={user}
            />
          </div>
        </div>
      )}

      {/* ── Save Modal ─────────────────────────────────────────────────────── */}
      {showSaveModal && (
        <SaveModal
          value={buildName}
          onChange={setBuildName}
          onSave={handleSave}
          onClose={() => setShowSaveModal(false)}
          loading={saveLoading}
        />
      )}

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ─── Step 2: Requirements Overview ───────────────────────────────────────────
function Step2Requirements({ petConfig, onStart, onChangePet }) {
  const { habitat, categories, tips, description } = petConfig;
  const required = categories.filter((c) => c.required);
  const optional = categories.filter((c) => !c.required);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(0,340px)", gap: 24 }}>
      {/* Left */}
      <div>
        {/* Description */}
        <div style={{
          background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 20,
          borderLeft: "4px solid #7c3aed",
        }}>
          <p style={{ fontSize: 15, color: "#4a148c", lineHeight: 1.7, margin: 0 }}>
            {description}
          </p>
        </div>

        {/* Habitat stats */}
        {habitat && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: 10,
            marginBottom: 20,
          }}>
            {habitat.tankSizeMin && (
              <StatCard icon="🏠" label="Min size" value={`${habitat.tankSizeMin}L`} />
            )}
            {habitat.temperatureRange && (
              <StatCard icon="🌡️" label="Temperature" value={`${habitat.temperatureRange.min}–${habitat.temperatureRange.max}°C`} />
            )}
            {habitat.humidityRange && (
              <StatCard icon="💧" label="Humidity" value={`${habitat.humidityRange.min}–${habitat.humidityRange.max}%`} />
            )}
            {habitat.lightingHours > 0 && (
              <StatCard icon="☀️" label="Light/day" value={`${habitat.lightingHours}h`} />
            )}
            {habitat.uvRequired && (
              <StatCard icon="⚡" label="UV-B" value="Required" highlight />
            )}
          </div>
        )}

        {/* Category checklist */}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>
          What you'll build
        </h3>
        {required.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Required</p>
            {required.map((cat) => (
              <ChecklistItem key={cat.key} label={cat.label} description={cat.description} required />
            ))}
          </>
        )}
        {optional.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 14, marginBottom: 6 }}>Optional</p>
            {optional.map((cat) => (
              <ChecklistItem key={cat.key} label={cat.label} description={cat.description} />
            ))}
          </>
        )}

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            onClick={onStart}
            style={{
              padding: "12px 28px",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
            }}
          >
            Start Building →
          </button>
          <button
            onClick={onChangePet}
            style={{
              padding: "12px 20px",
              background: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Change Pet
          </button>
        </div>
      </div>

      {/* Right: Tips sidebar */}
      <div style={{
        background: "#f8f8f8",
        borderRadius: 16,
        padding: "20px 20px",
        border: "1px solid #eee",
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          💡 Care tips
        </h3>
        {tips?.map((tip, i) => (
          <div key={i} style={{
            display: "flex",
            gap: 10,
            marginBottom: 14,
            fontSize: 13,
            color: "#555",
            lineHeight: 1.6,
          }}>
            <span style={{ color: "#7c3aed", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, highlight }) {
  return (
    <div style={{
      background: highlight ? "#fef3c7" : "#fff",
      border: `1px solid ${highlight ? "#fbbf24" : "#e5e7eb"}`,
      borderRadius: 10,
      padding: "10px 12px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: highlight ? "#92400e" : "#1a1a1a", marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ─── Checklist Item ───────────────────────────────────────────────────────────
function ChecklistItem({ label, description, required }) {
  return (
    <div style={{
      display: "flex",
      gap: 10,
      padding: "8px 0",
      borderBottom: "1px solid #f3f4f6",
      alignItems: "flex-start",
    }}>
      <span style={{
        fontSize: 13,
        color: required ? "#7c3aed" : "#9ca3af",
        flexShrink: 0,
        marginTop: 1,
      }}>
        {required ? "🔒" : "○"}
      </span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{label}</div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{description}</div>
      </div>
    </div>
  );
}

// ─── Category Accordion ───────────────────────────────────────────────────────
function CategoryAccordion({ category, products, selected, isOpen, isMissing, onToggleOpen, onToggleProduct }) {
  return (
    <div style={{
      background: "#fff",
      border: isMissing ? "1.5px solid #fca5a5" : "1.5px solid #e5e7eb",
      borderRadius: 14,
      marginBottom: 12,
      overflow: "hidden",
      boxShadow: isMissing ? "0 2px 8px rgba(239,68,68,0.08)" : "none",
    }}>
      {/* Header */}
      <button
        onClick={onToggleOpen}
        style={{
          width: "100%",
          padding: "14px 18px",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 18 }}>{isOpen ? "▾" : "▸"}</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", flex: 1 }}>
          {category.label}
        </span>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          padding: "3px 10px",
          borderRadius: 20,
          background: category.required ? "#ede9fe" : "#f3f4f6",
          color: category.required ? "#7c3aed" : "#6b7280",
        }}>
          {category.required ? "Required" : "Optional"}
        </span>
        <span style={{
          fontSize: 12,
          color: selected.length > 0 ? "#16a34a" : "#9ca3af",
          fontWeight: 600,
          marginLeft: 4,
        }}>
          {selected.length}/{category.maxSelectable}
        </span>
        {isMissing && (
          <span style={{ fontSize: 16 }}>⚠️</span>
        )}
      </button>

      {/* Body */}
      {isOpen && (
        <div style={{ padding: "0 18px 18px" }}>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 12, lineHeight: 1.5 }}>
            {category.description}
          </p>

          {products.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "24px 16px",
              background: "#f9fafb",
              borderRadius: 10,
              color: "#9ca3af",
              fontSize: 13,
            }}>
              No {category.label.toLowerCase()} products available yet
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 10,
            }}>
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  isSelected={selected.includes(product._id)}
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

// ─── Product Card (compact, builder-specific) ────────────────────────────────
function ProductCard({ product, isSelected, onToggle }) {
  const outOfStock = product.stock === 0;
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={outOfStock ? undefined : onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={outOfStock}
      title={outOfStock ? "Out of stock" : product.name}
      style={{
        background: isSelected
          ? "linear-gradient(135deg, #ede9fe, #ddd6fe)"
          : outOfStock ? "#f9fafb" : hovered ? "#fafafa" : "#fff",
        border: isSelected
          ? "2px solid #7c3aed"
          : outOfStock ? "1.5px solid #f3f4f6" : hovered ? "1.5px solid #d1d5db" : "1.5px solid #e5e7eb",
        borderRadius: 12,
        padding: "10px",
        cursor: outOfStock ? "not-allowed" : "pointer",
        textAlign: "left",
        opacity: outOfStock ? 0.55 : 1,
        transition: "all 0.15s ease",
        position: "relative",
        width: "100%",
      }}
    >
      {/* Image */}
      <div style={{
        width: "100%",
        aspectRatio: "1",
        borderRadius: 8,
        overflow: "hidden",
        background: "#f3f4f6",
        marginBottom: 8,
        position: "relative",
      }}>
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 28 }}>📦</div>
        )}
        {isSelected && (
          <div style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#7c3aed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "#fff",
            fontWeight: 700,
          }}>✓</div>
        )}
        {outOfStock && (
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 0",
            textAlign: "center",
          }}>OUT OF STOCK</div>
        )}
      </div>

      {/* Name */}
      <div style={{
        fontSize: 12,
        fontWeight: 600,
        color: isSelected ? "#4c1d95" : "#1a1a1a",
        lineHeight: 1.4,
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        marginBottom: 4,
      }}>{product.name}</div>

      {product.brand && (
        <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>{product.brand}</div>
      )}

      <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? "#7c3aed" : "#1a1a1a" }}>
        {formatPrice(product.price)}
      </div>
    </button>
  );
}

// ─── Summary Panel ────────────────────────────────────────────────────────────
function SummaryPanel({ liveTotal, totalItemCount, missingRequired, canAddToCart, cartLoading, onAddToCart, onSave, petConfig, user }) {
  return (
    <div style={{
      background: "#fff",
      border: "1.5px solid #e5e7eb",
      borderRadius: 16,
      padding: "20px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>
        Your Build Summary
      </h3>

      {/* Total */}
      <div style={{
        background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 14,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 12, color: "#7c3aed", fontWeight: 600, marginBottom: 4 }}>
          Live Total
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#4c1d95" }}>
          {formatPrice(liveTotal)}
        </div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
          {totalItemCount} item{totalItemCount !== 1 ? "s" : ""} selected
        </div>
      </div>

      {/* Missing required warnings */}
      {missingRequired.length > 0 && (
        <div style={{
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>
            ⚠️ Still needed:
          </div>
          {missingRequired.map((key) => {
            const cat = petConfig?.categories.find((c) => c.key === key);
            return (
              <div key={key} style={{ fontSize: 12, color: "#b45309", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                <span>•</span> {cat?.label || key}
              </div>
            );
          })}
        </div>
      )}

      {/* Add to cart */}
      <button
        onClick={onAddToCart}
        disabled={!canAddToCart || cartLoading}
        style={{
          width: "100%",
          padding: "13px 0",
          background: canAddToCart
            ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
            : "#e5e7eb",
          color: canAddToCart ? "#fff" : "#9ca3af",
          border: "none",
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 14,
          cursor: canAddToCart ? "pointer" : "not-allowed",
          marginBottom: 10,
          transition: "opacity 0.15s",
          opacity: cartLoading ? 0.7 : 1,
        }}
      >
        {cartLoading ? "Adding..." : !user ? "Login to Add to Cart" : "Add All to Cart 🛒"}
      </button>

      {/* Save build */}
      <button
        onClick={onSave}
        style={{
          width: "100%",
          padding: "11px 0",
          background: "#f3f4f6",
          color: "#374151",
          border: "none",
          borderRadius: 12,
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        💾 Save Build
      </button>
    </div>
  );
}

// ─── Save Modal ───────────────────────────────────────────────────────────────
function SaveModal({ value, onChange, onSave, onClose, loading }) {
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        padding: "32px 36px",
        maxWidth: 380,
        width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>
          Name your build
        </h3>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
          Give it a name so you can recognise it later.
        </p>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={60}
          placeholder="e.g. My Ball Python Setup"
          onKeyDown={(e) => { if (e.key === "Enter") onSave(); }}
          style={{
            width: "100%",
            padding: "11px 14px",
            border: "1.5px solid #d1d5db",
            borderRadius: 10,
            fontSize: 14,
            marginBottom: 20,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px 0",
              background: "#f3f4f6",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              color: "#374151",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!value.trim() || loading}
            style={{
              flex: 1,
              padding: "11px 0",
              background: !value.trim() ? "#e5e7eb" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
              color: !value.trim() ? "#9ca3af" : "#fff",
              border: "none",
              borderRadius: 10,
              cursor: !value.trim() ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {loading ? "Saving..." : "Save Build"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  const bg = type === "error" ? "#fef2f2" : type === "warning" ? "#fff7ed" : "#f0fdf4";
  const border = type === "error" ? "#fca5a5" : type === "warning" ? "#fed7aa" : "#86efac";
  const color = type === "error" ? "#b91c1c" : type === "warning" ? "#92400e" : "#166534";

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 12,
      padding: "12px 20px",
      fontSize: 14,
      color,
      fontWeight: 600,
      zIndex: 2000,
      maxWidth: "90vw",
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      animation: "slideUp 0.25s ease",
    }}>
      {msg}
      <style>{`@keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity:0; } to { transform: translateX(-50%) translateY(0); opacity:1; } }`}</style>
    </div>
  );
}

// ─── Builder Skeleton ────────────────────────────────────────────────────────
function BuilderSkeleton() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          height: 80,
          background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s infinite",
          borderRadius: 14,
          marginBottom: 12,
        }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}
