import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPetList, getMyBuilds } from "../api/ecosystem.api";
import { useBuilder } from "../context/BuilderContext";
import { useAuth } from "../context/AuthContext";

// ─── Pet icon map (emoji fallbacks) ──────────────────────────────────────────
const PET_ICONS = {
  fish:      "🐟",
  snake:     "🐍",
  bird:      "🦜",
  spider:    "🕷️",
  turtle:    "🐢",
  mouse:     "🐭",
  reptile:   "🦎",
  amphibian: "🐸",
};

export default function EcosystemPicker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { petType: currentPetType, hasSelections, setPet, clearSelections, loadBuild } = useBuilder();

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmChange, setConfirmChange] = useState(null); // petType to switch to
  const [mySavedBuilds, setMySavedBuilds] = useState([]);

  useEffect(() => {
    document.title = "Build a Pet Setup | PetCenter";
    getPetList()
      .then((res) => setPets(res.data.data || []))
      .catch(() => setError("Failed to load pet types. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    getMyBuilds()
      .then((res) => setMySavedBuilds(res.data.data || []))
      .catch((err) => console.error("Error loading my builds:", err));
  }, [user]);

  const handleLoadSavedBuild = (build) => {
    loadBuild(build);
    navigate(`/ecosystem/build/${build.petType}?step=3`);
  };

  const handlePickPet = (petType) => {
    // If user already has selections for a different pet, warn them
    if (hasSelections && currentPetType && currentPetType !== petType) {
      setConfirmChange(petType);
      return;
    }
    setPet(petType);
    navigate(`/ecosystem/build/${petType}?step=2`);
  };

  const handleConfirmChange = () => {
    clearSelections();
    setPet(confirmChange);
    navigate(`/ecosystem/build/${confirmChange}?step=2`);
    setConfirmChange(null);
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Saved Builds Banner */}
      {mySavedBuilds.length > 0 && (
        <div style={{
          background: "#f3e8ff",
          border: "1px solid #d8b4fe",
          borderRadius: 16,
          padding: "16px 24px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🌿</span>
            <div>
              <p style={{ margin: 0, fontWeight: 800, color: "#581c87", fontSize: 14 }}>
                Saved Builds Available
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "#6b21a8", fontWeight: 500 }}>
                {mySavedBuilds.length === 1 
                  ? `You have a saved ${mySavedBuilds[0].petType} build ("${mySavedBuilds[0].name || "My Setup"}").`
                  : `You have ${mySavedBuilds.length} saved habitat builds in your account.`
                }
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {mySavedBuilds.length === 1 ? (
              <button
                onClick={() => handleLoadSavedBuild(mySavedBuilds[0])}
                style={{
                  background: "#7c3aed",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)",
                  transition: "all 0.2s",
                }}
              >
                Load Build
              </button>
            ) : (
              <button
                onClick={() => navigate("/ecosystem/my-builds")}
                style={{
                  background: "#7c3aed",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)",
                  transition: "all 0.2s",
                }}
              >
                View Saved Builds
              </button>
            )}
          </div>
        </div>
      )}
      {/* ── Meta ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "linear-gradient(135deg, #e8f5e9, #f3e5f5)",
          borderRadius: 24,
          padding: "6px 16px",
          fontSize: 12,
          fontWeight: 600,
          color: "#4a148c",
          marginBottom: 16,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}>
          🌿 Ecosystem Builder
        </div>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 42px)",
          fontWeight: 800,
          color: "#1a1a1a",
          lineHeight: 1.15,
          marginBottom: 12,
        }}>
          Build the perfect habitat
        </h1>
        <p style={{ fontSize: 17, color: "#666", maxWidth: 560, lineHeight: 1.6 }}>
          Choose your pet and we'll guide you through everything it needs —
          from the enclosure to the final decoration. All products are pulled
          from our live store catalog.
        </p>
      </div>

      {/* ── Progress Indicator ─────────────────────────────────────────────── */}
      <StepIndicator currentStep={1} />

      {/* ── Pet Grid ──────────────────────────────────────────────────────── */}
      {loading ? (
        <PetGridSkeleton />
      ) : error ? (
        <div style={{
          textAlign: "center",
          padding: 48,
          background: "#fff0f0",
          borderRadius: 12,
          color: "#c62828",
          fontSize: 15,
        }}>{error}</div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 16,
          marginTop: 32,
        }}>
          {pets.map((pet) => (
            <PetCard
              key={pet.key}
              pet={pet}
              isActive={currentPetType === pet.key}
              onClick={() => handlePickPet(pet.key)}
            />
          ))}
        </div>
      )}

      {/* ── Confirm Change Dialog ──────────────────────────────────────────── */}
      {confirmChange && (
        <ConfirmDialog
          from={currentPetType}
          to={confirmChange}
          onConfirm={handleConfirmChange}
          onCancel={() => setConfirmChange(null)}
        />
      )}
    </div>
  );
}

// ─── Step Indicator ──────────────────────────────────────────────────────────
function StepIndicator({ currentStep }) {
  const steps = ["Pick Pet", "Review Requirements", "Build Setup"];
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 0,
      marginBottom: 8,
      background: "#f8f8f8",
      borderRadius: 12,
      padding: "10px 20px",
      border: "1px solid #eee",
    }}>
      {steps.map((label, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isDone = step < currentStep;
        return (
          <React.Fragment key={step}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: isActive
                  ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                  : isDone ? "#22c55e" : "#e5e7eb",
                color: isActive || isDone ? "#fff" : "#9ca3af",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {isDone ? "✓" : step}
              </div>
              <span style={{
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#4f46e5" : isDone ? "#16a34a" : "#9ca3af",
                whiteSpace: "nowrap",
              }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1,
                height: 2,
                background: isDone ? "#22c55e" : "#e5e7eb",
                margin: "0 10px",
                borderRadius: 2,
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Pet Card ─────────────────────────────────────────────────────────────────
function PetCard({ pet, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);
  const icon = PET_ICONS[pet.key] || "🐾";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isActive
          ? "linear-gradient(135deg, #7c3aed11, #4f46e511)"
          : hovered ? "#fafafa" : "#fff",
        border: isActive
          ? "2px solid #7c3aed"
          : hovered ? "2px solid #d1d5db" : "2px solid #f3f4f6",
        borderRadius: 16,
        padding: "24px 16px",
        cursor: "pointer",
        textAlign: "center",
        transition: "all 0.18s ease",
        transform: hovered || isActive ? "translateY(-3px)" : "none",
        boxShadow: hovered || isActive
          ? "0 8px 24px rgba(0,0,0,0.10)"
          : "0 1px 4px rgba(0,0,0,0.06)",
        width: "100%",
      }}
    >
      <div style={{ fontSize: 44, marginBottom: 10, lineHeight: 1 }}>{icon}</div>
      <div style={{
        fontSize: 15,
        fontWeight: 700,
        color: isActive ? "#7c3aed" : "#1a1a1a",
        marginBottom: 6,
      }}>
        {pet.displayName}
      </div>
      <div style={{
        fontSize: 12,
        color: "#888",
        lineHeight: 1.5,
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
      }}>
        {pet.description?.split(".")[0]}.
      </div>
      {isActive && (
        <div style={{
          marginTop: 10,
          fontSize: 11,
          fontWeight: 600,
          color: "#7c3aed",
          background: "#ede9fe",
          borderRadius: 8,
          padding: "2px 8px",
          display: "inline-block",
        }}>
          ✓ Selected
        </div>
      )}
    </button>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function PetGridSkeleton() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
      gap: 16,
      marginTop: 32,
    }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.4s infinite",
            borderRadius: 16,
            height: 160,
          }}
        />
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ from, to, onConfirm, onCancel }) {
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
        maxWidth: 400,
        width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>
          Change pet type?
        </h3>
        <p style={{ fontSize: 14, color: "#666", marginBottom: 24, lineHeight: 1.6 }}>
          You have an unsaved {from} build in progress. Switching to{" "}
          <strong>{to}</strong> will clear all your current selections.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px 0",
              background: "#f3f4f6",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              color: "#374151",
            }}
          >
            Keep building
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "10px 0",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              color: "#fff",
            }}
          >
            Switch & clear
          </button>
        </div>
      </div>
    </div>
  );
}

export { StepIndicator, PET_ICONS };
