import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, ShieldCheck, Sparkles } from "lucide-react";
import { getPetList, getMyBuilds, suggestBuild } from "../api/ecosystem.api";
import { useBuilder } from "../context/BuilderContext";
import { useAuth } from "../context/AuthContext";
import EcosystemTabs from "../components/ecosystem/EcosystemTabs";
import StepIndicator from "../components/ecosystem/StepIndicator";
import HabitatSlider from "../components/ecosystem/HabitatSlider";

const PET_ICONS = {
  fish: "🐟",
  snake: "🐍",
  bird: "🦜",
  spider: "🕷️",
  turtle: "🐢",
  mouse: "🐭",
  reptile: "🦎",
  amphibian: "🐸",
};

export default function EcosystemPicker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { petType: currentPetType, hasSelections, setPet, clearSelections, loadBuild } = useBuilder();

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmChange, setConfirmChange] = useState(null); // { petType, budgetCents? } | null
  const [mySavedBuilds, setMySavedBuilds] = useState([]);

  const [suggestPetType, setSuggestPetType] = useState("");
  const [suggestBudget, setSuggestBudget] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState("");

  useEffect(() => {
    document.title = "Build a pet setup | PetCenter";
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
    if (hasSelections && currentPetType && currentPetType !== petType) {
      setConfirmChange({ petType });
      return;
    }
    setPet(petType);
    navigate(`/ecosystem/build/${petType}?step=2`);
  };

  const runSuggestion = async (petType, budgetCents) => {
    setSuggesting(true);
    setSuggestError("");
    try {
      const res = await suggestBuild(petType, budgetCents);
      const suggestion = res.data.data;
      // Reuses the exact same context function used to load a saved build —
      // the suggestion response is shaped identically (petType + selections).
      loadBuild(suggestion);
      navigate(`/ecosystem/build/${petType}?step=3`, {
        state: {
          suggestion: {
            budget: suggestion.budget,
            totalPrice: suggestion.totalPrice,
            overBudget: suggestion.overBudget,
            notes: suggestion.notes,
            productIds: suggestion.selections.map((s) => s.productId),
          },
        },
      });
    } catch (err) {
      setSuggestError(err.response?.data?.message || "Couldn't generate a suggestion. Please try again.");
    } finally {
      setSuggesting(false);
    }
  };

  const handleSuggestSubmit = (e) => {
    e.preventDefault();
    if (!suggestPetType) {
      setSuggestError("Pick a pet type first.");
      return;
    }
    const budgetCents = Math.round(parseFloat(suggestBudget) * 100);
    if (!Number.isFinite(budgetCents) || budgetCents <= 0) {
      setSuggestError("Enter a budget greater than $0.");
      return;
    }
    setSuggestError("");

    if (hasSelections && currentPetType && currentPetType !== suggestPetType) {
      setConfirmChange({ petType: suggestPetType, budgetCents });
      return;
    }
    runSuggestion(suggestPetType, budgetCents);
  };

  const handleConfirmChange = () => {
    const { petType, budgetCents } = confirmChange;
    clearSelections();
    setConfirmChange(null);
    if (budgetCents) {
      runSuggestion(petType, budgetCents);
    } else {
      setPet(petType);
      navigate(`/ecosystem/build/${petType}?step=2`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-7 pt-8 pb-24">
      <div className="mb-7 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-12 lg:gap-14 items-center">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-3.5">Habitat builder</p>
          <h1 className="font-heading text-[34px] sm:text-[44px] font-medium tracking-tight mb-2.5">Design the habitat before they arrive</h1>
          <p className="text-[15px] leading-relaxed text-[#5c5c54] max-w-160">
            Choose your pet and we'll guide you through everything it needs — from the enclosure to the final decoration. All products are pulled from our live store catalog.
          </p>
        </div>

        <div className="relative hidden lg:block">
          <HabitatSlider />
          <div className="absolute -left-6 top-7 bg-light border border-border rounded-2xl px-4.5 py-3.5 shadow-xl shadow-black/10 flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-accent shrink-0" />
            <div>
              <p className="m-0 text-[11px] tracking-wider uppercase text-accent">Checked as you build</p>
              <p className="mt-0.5 mb-0 text-sm font-semibold text-[#292925]">Species compatibility</p>
            </div>
          </div>
        </div>
      </div>

      <EcosystemTabs />
      <StepIndicator currentStep={1} />

      {mySavedBuilds.length > 0 && (
        <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-accent/25 rounded-2xl px-6 py-4.5 mb-7 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="m-0 font-semibold text-[#292925] text-sm">Saved builds available</p>
            <p className="m-0 mt-0.5 text-[13px] text-[#6e6e64]">
              {mySavedBuilds.length === 1 ? `You have a saved ${mySavedBuilds[0].petType} build ("${mySavedBuilds[0].name || "My Setup"}").` : `You have ${mySavedBuilds.length} saved habitat builds.`}
            </p>
          </div>
          {mySavedBuilds.length === 1 ? (
            <button onClick={() => handleLoadSavedBuild(mySavedBuilds[0])} className="btn btn-primary px-5 py-2.5 text-sm shrink-0">
              Load build
            </button>
          ) : (
            <button onClick={() => navigate("/dashboard?tab=builds")} className="btn btn-primary px-5 py-2.5 text-sm shrink-0">
              View saved builds
            </button>
          )}
        </Motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 bg-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-[#F7E9DF] rounded-2xl text-[#8f4a28]">{error}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {pets.map((pet) => {
            const isActive = currentPetType === pet.key;
            return (
              <button
                key={pet.key}
                onClick={() => handlePickPet(pet.key)}
                className={`text-center rounded-2xl border p-6 transition-all hover:-translate-y-0.5 ${isActive ? "bg-accent/10 border-accent" : "bg-white border-border hover:border-[#cfc8ba]"}`}
              >
                <div className="text-[40px] mb-2.5 leading-none">{PET_ICONS[pet.key] || "🐾"}</div>
                <p className={`m-0 font-semibold text-[15px] mb-1.5 ${isActive ? "text-secondary" : "text-[#292925]"}`}>{pet.displayName}</p>
                <p className="m-0 text-xs text-[#8a8a80] leading-relaxed line-clamp-2">{pet.description?.split(".")[0]}.</p>
                {isActive && (
                  <span className="inline-flex items-center gap-1 mt-2.5 text-[11px] font-semibold text-secondary bg-accent/10 rounded-full px-2.5 py-1">
                    <Check size={11} strokeWidth={3} /> Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {!loading && !error && pets.length > 0 && (
        <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-7 bg-secondary text-light rounded-[26px] p-7 sm:p-8">
          <div className="flex items-center gap-2.5 mb-2">
            <Sparkles size={18} className="text-accent shrink-0" />
            <h3 className="font-heading text-lg font-medium m-0">Not sure where to start?</h3>
          </div>
          <p className="text-[13.5px] text-[#DCE0D6] mb-5 max-w-140">
            Tell us the pet and your budget — we'll pick real, in-stock essentials that fit, straight from the store catalog. You can swap anything before you save or buy.
          </p>
          <form onSubmit={handleSuggestSubmit} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-[#C8CFC1]">
              Pet type
              <select
                value={suggestPetType}
                onChange={(e) => setSuggestPetType(e.target.value)}
                className="bg-white text-[#292925] rounded-xl px-3.5 py-2.75 text-sm outline-none min-w-40 cursor-pointer"
              >
                <option value="">Choose a pet</option>
                {pets.map((pet) => (
                  <option key={pet.key} value={pet.key}>{pet.displayName}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-[#C8CFC1]">
              Budget (USD)
              <input
                type="number"
                min="1"
                step="0.01"
                value={suggestBudget}
                onChange={(e) => setSuggestBudget(e.target.value)}
                placeholder="e.g. 150"
                className="bg-white text-[#292925] rounded-xl px-3.5 py-2.75 text-sm outline-none w-32"
              />
            </label>
            <button type="submit" disabled={suggesting} className="btn bg-primary text-white hover:bg-primary-dark px-6 py-2.75 text-sm disabled:opacity-60">
              {suggesting ? "Thinking…" : "Suggest a build"}
            </button>
          </form>
          {suggestError && <p className="mt-3.5 text-[13px] text-[#F7C9B0] font-medium">{suggestError}</p>}
        </Motion.div>
      )}

      <AnimatePresence>
        {confirmChange && (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#292925]/40 backdrop-blur-sm p-4">
            <Motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[26px] shadow-2xl max-w-sm w-full p-8 border border-border">
              <div className="w-12 h-12 bg-[#F7E9DF] rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle size={22} className="text-[#8f4a28]" />
              </div>
              <h3 className="font-heading text-xl mb-2">Change pet type?</h3>
              <p className="text-[#6e6e64] text-sm mb-6 leading-relaxed">
                You have an unsaved {currentPetType} build in progress. Switching to <strong className="text-[#292925]">{confirmChange?.petType}</strong> will clear all your current selections.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmChange(null)} className="flex-1 py-3 bg-light text-[#4F5B4B] rounded-full font-medium hover:bg-border transition-colors">
                  Keep building
                </button>
                <button onClick={handleConfirmChange} className="flex-1 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors">
                  Switch &amp; clear
                </button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { PET_ICONS };
