/* Cart state, cart panel rendering, and quantity controls. */
import { state, saveToStorage } from "./store.js";
import { dom } from "./dom.js";
import { showToast } from "./utils.js";
import { renderProducts, updateCardCartState } from "./catalog.js";

export function isInCart(productId) {
  return state.cart.some((item) => item.id === productId);
}

export function cartQty(productId) {
  const item = state.cart.find((i) => i.id === productId);
  return item ? item.qty : 0;
}

export function getCartItemCount() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

export function addToCart(productId, quantity = null) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;

  let qtyToAdd = quantity;
  if (qtyToAdd === null) {
    const input = document.getElementById(`qty-${productId}`);
    qtyToAdd = input ? parseInt(input.value) || 1 : 1;
  }

  const existing = state.cart.find((item) => item.id === productId);
  if (existing) existing.qty += qtyToAdd;
  else state.cart.push({ id: productId, qty: qtyToAdd });

  saveToStorage("cr_cart", state.cart);
  updateCartUI();
  updateCardCartState(productId);
  showToast("success", "Added to Cart", `${qtyToAdd} box(es) of ${product.name}`);
}

export function removeFromCart(productId) {
  state.cart = state.cart.filter((item) => item.id !== productId);
  saveToStorage("cr_cart", state.cart);
  updateCartUI();
  updateCardCartState(productId);
}

export function updateQty(productId, delta) {
  const item = state.cart.find((i) => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId);
    return;
  }
  saveToStorage("cr_cart", state.cart);
  updateCartUI();
}

export function updateCartUI() {
  const count = getCartItemCount();
  dom.cartBadge.textContent = count;
  dom.cartBadge.classList.toggle("visible", count > 0);
  dom.cartFooter.style.display = count > 0 ? "block" : "none";
  dom.cartItemCount.textContent = count;
  dom.cartTotal.textContent = `${count} Boxes`;

  if (count === 0) {
    dom.cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <div class="empty-icon">🛒</div>
        <p>Your cart is empty</p>
        <div class="empty-hint">Browse products and add them here</div>
      </div>`;
    return;
  }

  dom.cartItemsEl.innerHTML = state.cart
    .map((item) => {
      const p = state.products.find((pr) => pr.id === item.id);
      if (!p) return "";
      return `
      <div class="cart-item" data-cart-id="${item.id}">
        <div class="cart-item-image"><img src="${p.image}" alt="${p.name}" loading="lazy" /></div>
        <div class="cart-item-details">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-meta">${p.packaging} · ${p.id}</div>
          <div class="cart-item-controls">
            <div class="qty-controls">
              <button class="qty-btn" data-action="decrease" data-id="${item.id}">−</button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
            </div>
            <span class="cart-unit-tag">Units</span>
          </div>
          <button class="remove-item-btn" data-id="${item.id}">Remove</button>
        </div>
      </div>`;
    })
    .join("");
}

export function openCart() {
  dom.cartOverlay.classList.add("open");
  dom.cartPanel.classList.add("open");
  document.body.style.overflow = "hidden";
}

export function closeCart() {
  dom.cartOverlay.classList.remove("open");
  dom.cartPanel.classList.remove("open");
  document.body.style.overflow = "";
}

// Re-export so other modules can trigger a full grid refresh when needed.
export { renderProducts };
