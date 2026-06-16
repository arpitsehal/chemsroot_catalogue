/*
 * Central application state + localStorage persistence.
 * All mutable app state lives on the `state` object so it can be
 * shared (by reference) across feature modules without re-binding.
 */
import { SEED_PRODUCTS, PRODUCT_CATEGORIES, PRODUCT_LABELS } from "./data.js";

export function loadFromStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Storage save failed:", e);
  }
}

// ── Bootstrap persisted collections ────────────────────────
let products = loadFromStorage("cr_products", null);
if (!products) {
  products = JSON.parse(JSON.stringify(SEED_PRODUCTS));
  saveToStorage("cr_products", products);
} else {
  // Migrate legacy single-`label` field → `labels` array.
  let migrated = false;
  products.forEach((p) => {
    if (p.label && !p.labels) {
      p.labels = [p.label];
      delete p.label;
      migrated = true;
    }
  });
  if (migrated) saveToStorage("cr_products", products);
}

let dynamicCategories = loadFromStorage("cr_categories", null);
if (!dynamicCategories) {
  dynamicCategories = [...PRODUCT_CATEGORIES];
  saveToStorage("cr_categories", dynamicCategories);
}

let dynamicLabels = loadFromStorage("cr_labels", null);
if (!dynamicLabels) {
  dynamicLabels = [...PRODUCT_LABELS];
  saveToStorage("cr_labels", dynamicLabels);
}

// ── Shared, mutable state ──────────────────────────────────
export const state = {
  products,
  dynamicCategories,
  dynamicLabels,
  cart: loadFromStorage("cr_cart", []),
  orders: loadFromStorage("cr_orders", []),
  currentUser: loadFromStorage("cr_user", null),

  // Catalog UI
  currentCategory: "All",
  currentLabel: "All",
  searchQuery: "",

  // Session
  isAdmin: false,

  // Admin UI
  adminSearch: "",
  adminCategoryFilter: "All",
  adminLabelFilter: "All",
  currentFormLabels: [],
  uploadedImageDataUrl: null,

  // Order flow
  loginIntent: null,
  pendingCartAction: null,
  lastPlacedOrder: null,
  editingOrderId: null,
  pendingDeleteId: null,
};
