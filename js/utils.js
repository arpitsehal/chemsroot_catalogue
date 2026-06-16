/* Small shared helpers: search highlighting, badges, dates, toasts. */
import { state } from "./store.js";
import { dom } from "./dom.js";

export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightMatch(text) {
  if (!state.searchQuery.trim()) return text;
  const regex = new RegExp(`(${escapeRegex(state.searchQuery)})`, "gi");
  return String(text).replace(regex, '<mark class="search-hl">$1</mark>');
}

export function getBadgeHTML(badge) {
  if (!badge) return "";
  return `<span class="product-badge ${badge.toLowerCase()}">${badge}</span>`;
}

export function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TOAST_ICONS = { success: "✅", info: "ℹ️", warning: "⚠️", error: "❌" };

export function showToast(type, title, message, duration = 3500) {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || "ℹ️"}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ""}
    </div>`;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("exit");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
