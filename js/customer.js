/* Customer login, checkout / order placement, receipts, dashboard. */
import { state, saveToStorage } from "./store.js";
import { dom } from "./dom.js";
import { showToast, formatDate } from "./utils.js";
import { addToCart, updateCartUI, openCart, closeCart, getCartItemCount } from "./cart.js";
import { renderProducts, updateUserButton } from "./catalog.js";
import { useRemote, upsertOrderRemote } from "./supabase.js";

// ── Login ──────────────────────────────────────────────────
export function openCustomerLogin(intent = null, productId = null) {
  state.loginIntent = intent;
  state.pendingCartAction = productId;

  if (intent === "checkout") dom.customerLoginBtn.textContent = "Login & Place Order";
  else if (intent === "add_to_cart") dom.customerLoginBtn.textContent = "Login & Add to Cart";
  else dom.customerLoginBtn.textContent = "Login";

  dom.customerModal.classList.add("open");
  document.body.style.overflow = "hidden";
  showCustomerStep("phone");
  if (state.currentUser) {
    dom.phoneInput.value = state.currentUser.phone || "";
    dom.customerNameInput.value = state.currentUser.name || "";
  }
  validateCustomerForm();
}

export function closeCustomerLogin() {
  dom.customerModal.classList.remove("open");
  document.body.style.overflow = "";
}

export function showCustomerStep(step) {
  dom.stepPhone.classList.remove("active");
  dom.stepSuccess.classList.remove("active");
  if (step === "phone") dom.stepPhone.classList.add("active");
  if (step === "success") dom.stepSuccess.classList.add("active");
}

export function validateCustomerForm() {
  const phone = dom.phoneInput.value.replace(/\D/g, "");
  const name = dom.customerNameInput.value.trim();
  dom.customerLoginBtn.disabled = phone.length < 10 || name.length < 2;
}

export function customerLogin() {
  const name = dom.customerNameInput.value.trim();
  const phone = dom.phoneInput.value.trim();
  if (!name || !phone) return;

  state.currentUser = { name, phone, loggedInAt: new Date().toISOString() };
  saveToStorage("cr_user", state.currentUser);
  updateUserButton();

  if (state.loginIntent === "add_to_cart" && state.pendingCartAction) {
    closeCustomerLogin();
    addToCart(state.pendingCartAction);
    pulseCartBadge();
    state.loginIntent = null;
    state.pendingCartAction = null;
  } else if (state.loginIntent === "checkout") {
    placeOrder();
  } else {
    closeCustomerLogin();
    showToast("success", "Logged In", "Welcome to Chems Root");
  }
}

function pulseCartBadge() {
  dom.cartBadge.style.transform = "scale(1.3)";
  setTimeout(() => (dom.cartBadge.style.transform = ""), 200);
}

// ── Place order ────────────────────────────────────────────
export async function placeOrder() {
  const orderId = state.editingOrderId || "ORD-" + Date.now().toString(36).toUpperCase();
  const orderItems = state.cart.map((item) => {
    const p = state.products.find((pr) => pr.id === item.id);
    return { id: item.id, name: p ? p.name : "Unknown", qty: item.qty, category: p ? p.category : "" };
  });

  const totalBoxes = getCartItemCount();
  const order = {
    orderId,
    customer: { ...state.currentUser },
    items: orderItems,
    totalBoxes,
    itemCount: orderItems.length,
    placedAt: new Date().toISOString(),
    status: "pending",
  };

  if (state.editingOrderId) {
    const idx = state.orders.findIndex((o) => o.orderId === state.editingOrderId);
    if (idx !== -1) state.orders[idx] = order;
    else state.orders.push(order);
    state.editingOrderId = null;
  } else {
    state.orders.push(order);
  }
  saveToStorage("cr_orders", state.orders);

  if (useRemote) {
    upsertOrderRemote({
      order_id: order.orderId,
      customer: order.customer,
      items: order.items,
      total_boxes: order.totalBoxes,
      item_count: order.itemCount,
      placed_at: order.placedAt,
      status: order.status,
    });
  }

  state.lastPlacedOrder = order;
  renderOrderConfirmation(order);
  showCustomerStep("success");

  state.cart = [];
  saveToStorage("cr_cart", state.cart);
  updateCartUI();
  renderProducts();
  closeCart();

  showToast("success", "Order Confirmed!", `Order ${orderId} saved.`);
}

export function generateReceiptHTML(order) {
  return `
    <div class="receipt-wrapper">
      <div class="receipt-header">
        <div class="receipt-header-left">
          <img src="assets/logo.jpg" alt="Chems Root Logo" />
          <div class="receipt-title">
            <h2>Chems Root Pharmaceutical</h2>
            <p>PCD Order Invoice</p>
          </div>
        </div>
        <div class="receipt-meta">
          <div><strong>Order ID:</strong> ${order.orderId}</div>
          <div><strong>Date:</strong> ${formatDate(order.placedAt).split(",")[0]}</div>
        </div>
      </div>

      <div class="receipt-bill-to">
        <h4>Bill To</h4>
        <div class="customer-name">${order.customer.name}</div>
        <div class="customer-phone">📱 ${order.customer.phone}</div>
      </div>

      <table class="receipt-table">
        <thead>
          <tr>
            <th class="col-sno">S.No</th>
            <th>Product Details</th>
            <th>Ordered Qty</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map(
              (item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>
                <div class="receipt-item-desc">${item.name}</div>
                <div class="receipt-item-cat">${item.category || item.id}</div>
              </td>
              <td>${item.qty} Boxes</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>

      <div class="receipt-total">
        <span class="total-label">Total Quantities Ordered</span>
        <span class="total-value">${order.totalBoxes} Boxes</span>
      </div>
    </div>`;
}

export function renderOrderConfirmation(order) {
  dom.orderConfirmation.innerHTML = generateReceiptHTML(order);
}

// ── Dashboard ──────────────────────────────────────────────
export function openCustomerDashboard() {
  dom.customerDashboardModal.classList.add("open");
  document.body.style.overflow = "hidden";
  dom.dashboardUserInfo.innerHTML = `<strong>${state.currentUser.name}</strong><br/>${state.currentUser.phone}`;
  renderCustomerOrders();
}

export function closeCustomerDashboard() {
  dom.customerDashboardModal.classList.remove("open");
  document.body.style.overflow = "";
}

export function renderCustomerOrders() {
  const myOrders = state.orders.filter((o) => o.customer.phone === state.currentUser.phone).reverse();

  if (myOrders.length === 0) {
    dom.customerOrdersList.innerHTML = `<p class="dashboard-empty">You haven't placed any orders yet.</p>`;
    return;
  }

  dom.customerOrdersList.innerHTML = myOrders
    .map(
      (order) => `
      <div class="admin-order" id="my-order-${order.orderId}">
        <div class="admin-order-header">
          <span class="admin-order-id">${order.orderId}</span>
          <span class="admin-order-date">${formatDate(order.placedAt)}</span>
        </div>
        <div class="admin-order-items">
          ${order.items
            .map(
              (item) => `
            <div class="admin-order-item">
              <span>${item.name}</span>
              <span class="order-item-qty">×${item.qty} Boxes</span>
            </div>`
            )
            .join("")}
        </div>
        <div class="admin-order-total">
          <span>Total Quantities</span>
          <span>${order.totalBoxes} Boxes</span>
        </div>
        <div class="order-actions">
          <button class="modal-btn secondary order-action-btn" data-order-action="edit" data-order-id="${order.orderId}">✏️ Edit</button>
          <button class="modal-btn secondary order-action-btn" data-order-action="save" data-order-id="${order.orderId}">📸 Save</button>
          <button class="modal-btn order-action-btn order-share-btn" data-order-action="share" data-order-id="${order.orderId}">💬 Share</button>
        </div>
      </div>`
    )
    .join("");
}

export function editOrder(orderId) {
  const order = state.orders.find((o) => o.orderId === orderId);
  if (!order) return;

  state.cart = order.items.map((i) => ({ id: i.id, qty: i.qty }));
  saveToStorage("cr_cart", state.cart);
  updateCartUI();
  renderProducts();

  state.editingOrderId = order.orderId;
  closeCustomerDashboard();
  openCart();
  showToast("info", "Editing Order", `You are now editing ${orderId}. Cart updated.`);
}

export function saveReceiptFor(orderId) {
  const order = state.orders.find((o) => o.orderId === orderId);
  if (order) downloadReceiptImage(order);
}

export function shareWhatsAppFor(orderId) {
  const order = state.orders.find((o) => o.orderId === orderId);
  if (order) shareOrderWhatsApp(order);
}

// ── Receipt image (lazy html2canvas) ───────────────────────
export async function downloadReceiptImage(order) {
  showToast("info", "Generating", "Preparing receipt image...");
  let html2canvas;
  try {
    const mod = await import("https://esm.sh/html2canvas@1.4.1");
    html2canvas = mod.default || mod;
  } catch (e) {
    console.error(e);
    showToast("error", "Error", "Could not load image library.");
    return;
  }

  const tempContainer = document.createElement("div");
  tempContainer.className = "offscreen-capture";
  tempContainer.innerHTML = generateReceiptHTML(order);
  document.body.appendChild(tempContainer);
  const captureEl = tempContainer.firstElementChild;

  try {
    const canvas = await html2canvas(captureEl, { scale: 2, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = `Invoice_${order.orderId}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.9);
    link.click();
    showToast("success", "Receipt Saved", "The invoice has been downloaded.");
  } catch (err) {
    console.error(err);
    showToast("error", "Error", "Could not save receipt image.");
  } finally {
    document.body.removeChild(tempContainer);
  }
}

export function shareOrderWhatsApp(order) {
  let text = `*Chems Root Pharmaceutical Order*\n\n`;
  text += `*Order ID:* ${order.orderId}\n`;
  text += `*Customer:* ${order.customer.name} (${order.customer.phone})\n\n`;
  text += `*Items:*\n`;
  order.items.forEach((item) => {
    text += `- ${item.name} x${item.qty} Boxes\n`;
  });
  text += `\n*Total Units:* ${order.totalBoxes} Boxes`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}
