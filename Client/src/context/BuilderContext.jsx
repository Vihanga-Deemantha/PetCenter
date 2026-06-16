import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const BuilderContext = createContext(null);

const SESSION_KEY = "petcenter_builder_state";

const INITIAL_STATE = {
  petType: null,
  step: 1,
  selections: {},       // { [categoryKey]: [productId, ...] }
  loadedBuildId: null,  // set when editing an existing saved build
};

const loadFromSession = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveToSession = (state) => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    /* ignore — storage quota exceeded */
  }
};

const clearSession = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
};

export const BuilderProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    const saved = loadFromSession();
    return saved || INITIAL_STATE;
  });

  // Persist to sessionStorage on every state change
  useEffect(() => {
    saveToSession(state);
  }, [state]);

  // ── setPet ──────────────────────────────────────────────────────────────────
  // Sets the pet type and resets selections. Caller is responsible for showing
  // a confirmation dialog before calling this if selections exist.
  const setPet = useCallback((petType) => {
    setState({
      ...INITIAL_STATE,
      petType,
      step: 2,
    });
  }, []);

  // ── setStep ─────────────────────────────────────────────────────────────────
  const setStep = useCallback((step) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  // ── toggleSelection ─────────────────────────────────────────────────────────
  // Toggles a product in a category. Enforces maxSelectable.
  // - maxSelectable: 1 → swap (deselect old, select new)
  // - maxSelectable: N → toggle within the limit
  const toggleSelection = useCallback((categoryKey, productId, maxSelectable = 1) => {
    setState((prev) => {
      const current = prev.selections[categoryKey] || [];
      let next;

      const isSelected = current.includes(productId);

      if (isSelected) {
        // Deselect
        next = current.filter((id) => id !== productId);
      } else if (maxSelectable === 1) {
        // Single-select: replace
        next = [productId];
      } else if (current.length < maxSelectable) {
        // Multi-select: add
        next = [...current, productId];
      } else {
        // At limit — swap oldest for newest
        next = [...current.slice(1), productId];
      }

      return {
        ...prev,
        selections: {
          ...prev.selections,
          [categoryKey]: next,
        },
      };
    });
  }, []);

  // ── clearSelections ─────────────────────────────────────────────────────────
  const clearSelections = useCallback(() => {
    setState(INITIAL_STATE);
    clearSession();
  }, []);

  // ── loadBuild ───────────────────────────────────────────────────────────────
  // Restores state from a saved build document (from getMyBuilds or cloneBuild).
  // Converts the selections array to the { [categoryKey]: [productId] } map.
  const loadBuild = useCallback((build) => {
    const selectionsMap = {};
    for (const sel of build.selections || []) {
      if (!selectionsMap[sel.categoryKey]) {
        selectionsMap[sel.categoryKey] = [];
      }
      selectionsMap[sel.categoryKey].push(sel.productId.toString());
    }
    setState({
      petType: build.petType,
      step: 3,
      selections: selectionsMap,
      loadedBuildId: build._id,
    });
  }, []);

  // ── getTotalPrice ────────────────────────────────────────────────────────────
  // Calculates the live total from a productMap ({ productId → product object }).
  // Pure client-side arithmetic — no API call.
  const getTotalPrice = useCallback(
    (productMap) => {
      let total = 0;
      for (const ids of Object.values(state.selections)) {
        for (const id of ids) {
          const product = productMap[id];
          if (product) total += product.price;
        }
      }
      return total;
    },
    [state.selections]
  );

  // ── getMissingRequired ───────────────────────────────────────────────────────
  // Returns array of category keys that are required but have no selection.
  const getMissingRequired = useCallback(
    (petConfig) => {
      if (!petConfig) return [];
      return petConfig.categories
        .filter((cat) => cat.required)
        .map((cat) => cat.key)
        .filter((key) => {
          const selected = state.selections[key] || [];
          return selected.length === 0;
        });
    },
    [state.selections]
  );

  // ── isReadyToAddCart ─────────────────────────────────────────────────────────
  const isReadyToAddCart = useCallback(
    (petConfig) => getMissingRequired(petConfig).length === 0,
    [getMissingRequired]
  );

  // ── getSelectedItems ─────────────────────────────────────────────────────────
  // Returns a flat array of { productId, quantity: 1 } for bulkAddToCart.
  const getSelectedItems = useCallback(() => {
    const items = [];
    for (const ids of Object.values(state.selections)) {
      for (const productId of ids) {
        items.push({ productId, quantity: 1 });
      }
    }
    return items;
  }, [state.selections]);

  // ── hasSelections ────────────────────────────────────────────────────────────
  const hasSelections = Object.values(state.selections).some((ids) => ids.length > 0);

  // ── totalItemCount ───────────────────────────────────────────────────────────
  const totalItemCount = Object.values(state.selections).reduce(
    (sum, ids) => sum + ids.length,
    0
  );

  return (
    <BuilderContext.Provider
      value={{
        petType: state.petType,
        step: state.step,
        selections: state.selections,
        loadedBuildId: state.loadedBuildId,
        hasSelections,
        totalItemCount,
        setPet,
        setStep,
        toggleSelection,
        clearSelections,
        loadBuild,
        getTotalPrice,
        getMissingRequired,
        isReadyToAddCart,
        getSelectedItems,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBuilder = () => useContext(BuilderContext);
