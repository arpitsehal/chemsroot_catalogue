/* ==========================================================
   Chems Root Pharmaceutical — Product Catalog
   Application Logic v2.0
   Features: Admin CRUD, Label Filters, Phone Login, Orders
   ========================================================== */

(function () {
  "use strict";

  // ── Supabase Configuration ────────────────────────────────
  const SUPABASE_URL = 'https://ernnvnruesxnroquvede.supabase.co'; 
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVybm52bnJ1ZXN4bnJvcXV2ZWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMzc2OTYsImV4cCI6MjA5MjYxMzY5Nn0.4wMpVSUPgihN3HwBvNvEk-SOSWFfEhj9Tb0mkeM7qXg';
  const useRemote = SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE';
  const supabaseClient = useRemote ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

  async function fetchProductsFromRemote() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient.from('products').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        products = data;
        saveToStorage("cr_products", products);
      }
    } catch (e) { console.error('Supabase fetch products error:', e); }
  }

  async function fetchOrdersFromRemote() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient.from('orders').select('*');
      if (error) throw error;
      if (data) {
        orders = data;
        saveToStorage("cr_orders", orders);
      }
    } catch (e) { console.error('Supabase fetch orders error:', e); }
  }

  window.seedSupabase = async function() {
    if (!supabaseClient) {
      alert("Please configure SUPABASE_URL and SUPABASE_KEY in app.js first.");
      return;
    }
    const confirmed = confirm("This will upload SEED_PRODUCTS to the Supabase database. Are you sure?");
    if (!confirmed) return;
    
    showToast("info", "Seeding", "Uploading products...");
    try {
      const { error } = await supabaseClient.from('products').upsert(SEED_PRODUCTS);
      if (error) throw error;
      showToast("success", "Success", "Products seeded to database!");
      await fetchProductsFromRemote();
      renderProducts();
    } catch(err) {
      showToast("error", "Error", err.message);
    }
  };

  // ── State ──────────────────────────────────────────────
  let products = loadFromStorage("cr_products", null);
  if (!products) {
    // First load — seed from default data
    products = JSON.parse(JSON.stringify(SEED_PRODUCTS));
    saveToStorage("cr_products", products);
  } else {
    // Migrate standard local storage arrays
    let migrated = false;
    products.forEach(p => {
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

  let cart = loadFromStorage("cr_cart", []);
  let currentCategory = "All";
  let currentLabel = "All";
  let searchQuery = "";
  let currentUser = loadFromStorage("cr_user", null);
  let orders = loadFromStorage("cr_orders", []);
  let isAdmin = false;

  // Admin search/filter state
  let adminSearch = "";
  let adminCategoryFilter = "All";
  let adminLabelFilter = "All";
  let currentFormLabels = [];

  window.removeFormLabel = function(lbl) {
    currentFormLabels = currentFormLabels.filter(l => l !== lbl);
    renderFormLabels();
  };

  function renderFormLabels() {
    formSelectedLabelsContainer.innerHTML = currentFormLabels.map(l => {
      const c = LABEL_COLORS[l] || LABEL_COLORS.General;
      return `<span class="label-cell-tag" style="background:${c.bg}; color:${c.text}; border:1px solid ${c.border}; display:inline-flex; align-items:center; gap:6px; padding:4px 10px; font-size:0.75rem; border-radius:99px;">
        ${l} <span style="cursor:pointer; opacity:0.7;" onclick="removeFormLabel('${l}')">✕</span>
      </span>`;
    }).join("");
    // Also re-render the select so it hides already picked ones
    populateAdminFilters();
  }

  // ── DOM Refs ───────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const productGrid = $("#product-grid");
  const filterPills = $("#filter-pills");
  const labelPills = $("#label-pills");
  const searchInput = $("#search-input");
  const productsHeading = $("#products-heading");
  const productCountEl = $("#product-count");

  // Header user button
  const userBtn = $("#user-btn");
  const userLabel = $("#user-label");

  // Cart
  const cartToggle = $("#cart-toggle-btn");
  const cartOverlay = $("#cart-overlay");
  const cartPanel = $("#cart-panel");
  const closeCartBtn = $("#close-cart-btn");
  const cartItemsEl = $("#cart-items");
  const cartFooter = $("#cart-footer");
  const cartBadge = $("#cart-badge");
  const cartItemCount = $("#cart-item-count");
  const cartTotal = $("#cart-total");
  const checkoutBtn = $("#checkout-btn");

  // Customer Login Modal
  const customerModal = $("#customer-login-modal");
  const customerModalClose = $("#customer-modal-close");
  const phoneInput = $("#phone-input");
  const customerNameInput = $("#customer-name");
  const customerLoginBtn = $("#customer-login-btn");
  const continueShoppingBtn = $("#continue-shopping-btn");
  const orderConfirmation = $("#order-confirmation");
  const stepPhone = $("#customer-step-phone");
  const stepSuccess = $("#customer-step-success");
  
  // Dashboard & Success Actions
  const customerDashboardModal = $("#customer-dashboard-modal");
  const customerDashboardClose = $("#customer-dashboard-close");
  const dashboardUserInfo = $("#dashboard-user-info");
  const customerOrdersList = $("#customer-orders-list");
  const customerLogoutBtn = $("#customer-logout-btn");
  const btnSaveReceipt = $("#btn-save-receipt");
  const btnShareWa = $("#btn-share-wa");

  // Admin Login Modal
  const adminLoginModal = $("#admin-login-modal");
  const adminLoginClose = $("#admin-login-close");
  const adminUsername = $("#admin-username");
  const adminPassword = $("#admin-password");
  const adminLoginBtn = $("#admin-login-btn");
  const adminLoginError = $("#admin-login-error");

  // Admin Panel
  const adminToggle = $("#admin-toggle-btn");
  const adminPanel = $("#admin-panel");
  const closeAdminBtn = $("#close-admin-btn");

  // Admin Tabs
  const adminTabBtns = $$(".admin-tab-btn");
  const adminProductsTab = $("#admin-products-tab");
  const adminOrdersTab = $("#admin-orders-tab");
  const adminAddTab = $("#admin-add-tab");
  const adminOrdersContent = $("#admin-orders-content");

  // Admin Products Table
  const adminProductSearch = $("#admin-product-search");
  const adminCategoryFilterEl = $("#admin-category-filter");
  const adminLabelFilterEl = $("#admin-label-filter");
  const adminProductsTbody = $("#admin-products-tbody");

  // Admin Form
  const adminProductForm = $("#admin-product-form");
  const formEditId = $("#form-edit-id");
  const formProductId = $("#form-product-id");
  const formProductName = $("#form-product-name");
  const formComposition = $("#form-composition");
  const formDescription = $("#form-description");
  const formCategory = $("#form-category");
  const formCustomCategory = $("#form-custom-category");
  const formLabelSelect = $("#form-label-select");
  const formCustomLabelWrap = $("#form-custom-label-wrap");
  const formCustomLabel = $("#form-custom-label");
  const formAddLabelBtn = $("#form-add-label-btn");
  const formCancelCustomLabelBtn = $("#form-cancel-custom-label-btn");
  const formSelectedLabelsContainer = $("#form-selected-labels-container");
  const formPrice = $("#form-price");
  const formPackaging = $("#form-packaging");
  const formBadge = $("#form-badge");
  const formImageInput = $("#form-image");
  const formImagePreview = $("#form-image-preview");
  let uploadedImageDataUrl = null;
  const formTitle = $("#admin-form-title");
  const formSubmitBtn = $("#form-submit-btn");
  const formCancelBtn = $("#form-cancel-btn");

  // Toast
  const toastContainer = $("#toast-container");

  // ── Init ───────────────────────────────────────────────
  async function init() {
    if (useRemote && supabaseClient) {
      await fetchProductsFromRemote();
      await fetchOrdersFromRemote();
    }
    renderLabelPills();
    renderFilterPills();
    renderProducts();
    updateCartUI();
    updateUserButton();
    populateAdminFilters();
    bindEvents();

    const seedBtn = document.getElementById("admin-seed-supabase-btn");
    if (seedBtn) seedBtn.addEventListener("click", window.seedSupabase);
  }

  // ── Storage Helpers ────────────────────────────────────
  function loadFromStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch { return fallback; }
  }

  function saveToStorage(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { console.warn("Storage save failed:", e); }
  }

  // ── Render: Label Pills (Medical Specialties) ─────────
  function renderLabelPills() {
    labelPills.innerHTML = dynamicLabels.map((lbl) => {
      const isActive = lbl === currentLabel;
      const colors = LABEL_COLORS[lbl];
      let style = "";
      if (isActive && colors) {
        style = `background:${colors.text};color:#fff;border-color:${colors.text};`;
      } else if (colors) {
        style = `background:${colors.bg};color:${colors.text};border-color:${colors.border};`;
      }
      return `<button class="label-pill${isActive ? " active" : ""}" 
              data-label="${lbl}" style="${style}">${lbl}</button>`;
    }).join("");
  }

  // ── Render: Category Filter Pills ─────────────────────
  function renderFilterPills() {
    filterPills.innerHTML = dynamicCategories.map(
      (cat) => `<button class="filter-pill${cat === currentCategory ? " active" : ""}" 
                data-category="${cat}">${cat}</button>`
    ).join("");
  }

  // ── Render: Products ──────────────────────────────────
  function renderProducts() {
    const filtered = getFilteredProducts();

    productsHeading.textContent =
      currentCategory === "All" && currentLabel === "All"
        ? "All Products"
        : currentLabel !== "All" && currentCategory !== "All"
        ? `${currentLabel} — ${currentCategory}`
        : currentLabel !== "All"
        ? currentLabel
        : currentCategory;

    productCountEl.textContent = `${filtered.length} product${filtered.length !== 1 ? "s" : ""}`;

    if (filtered.length === 0) {
      productGrid.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <p>No products found</p>
          <div class="no-results-hint">Try a different search, category, or specialty</div>
        </div>`;
      return;
    }

    productGrid.innerHTML = filtered.map((p, i) => {
      const labelsToRender = p.labels && p.labels.length ? p.labels : ["General"];
      const labelTagsHTML = labelsToRender.map(lbl => {
        const c = LABEL_COLORS[lbl] || LABEL_COLORS.General;
        return `<span class="card-label-tag" style="background:${c.bg};color:${c.text};border-color:${c.border};">${lbl}</span>`;
      }).join("");

      return `
      <div class="product-card" style="animation-delay: ${i * 0.04}s" data-product-id="${p.id}">
        <div class="card-image">
          ${getBadgeHTML(p.badge)}
          <div style="position:absolute; top:12px; right:12px; display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
            ${labelTagsHTML}
          </div>
          <img src="${p.image}" alt="${p.name}" loading="lazy" />
        </div>
        <div class="card-body">
          <div class="card-id">${p.id}</div>
          <div class="card-category">${p.category}</div>
          <h3 class="card-title">${highlightMatch(p.name)}</h3>
          <div class="card-composition">💊 ${highlightMatch(p.composition)}</div>
          <p class="card-description">${p.description}</p>
          <div class="card-packaging">📦 ${p.packaging}</div>
          <div class="card-footer">
            <div class="card-price"><span class="currency">MRP ₹</span>${p.price.toFixed(2)}</div>
            <div class="add-to-cart-wrap">
              <input type="number" id="qty-${p.id}" class="qty-input" value="${isInCart(p.id) ? cart.find(i=>i.id===p.id).qty : 1}" min="1" />
              <button class="add-to-cart-btn ${isInCart(p.id) ? "added" : ""}" data-id="${p.id}">
                <span class="btn-icon">${isInCart(p.id) ? "↻" : "+"}</span>
                <span>${isInCart(p.id) ? "Update" : "Add"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>`;
    }).join("");
  }

  function getFilteredProducts() {
    let list = products;
    if (currentCategory !== "All") list = list.filter((p) => p.category === currentCategory);
    if (currentLabel !== "All") list = list.filter((p) => p.labels && p.labels.includes(currentLabel));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.composition.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.labels && p.labels.some(l => l.toLowerCase().includes(q)))
      );
    }
    return list;
  }

  function highlightMatch(text) {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${escapeRegex(searchQuery)})`, "gi");
    return text.replace(regex, '<mark style="background:var(--brand-teal-glow);color:var(--text-primary);border-radius:2px;padding:0 2px;">$1</mark>');
  }

  function escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function getBadgeHTML(badge) {
    if (!badge) return "";
    return `<span class="product-badge ${badge.toLowerCase()}">${badge}</span>`;
  }

  // ── User Button ────────────────────────────────────────
  function updateUserButton() {
    if (currentUser) {
      userLabel.textContent = currentUser.name || currentUser.phone;
      userBtn.classList.add("logged-in");
    } else {
      userLabel.textContent = "Login";
      userBtn.classList.remove("logged-in");
    }
  }

  // ── Cart Logic ─────────────────────────────────────────
  function isInCart(productId) { return cart.some((item) => item.id === productId); }

  function addToCart(productId, quantity = null) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    
    // If quantity is not explicitly passed, read from the input
    let qtyToAdd = quantity;
    if (qtyToAdd === null) {
      const input = document.getElementById(`qty-${productId}`);
      qtyToAdd = input ? parseInt(input.value) || 1 : 1;
    }
    
    const existing = cart.find((item) => item.id === productId);
    if (existing) { existing.qty += qtyToAdd; }
    else { cart.push({ id: productId, qty: qtyToAdd }); }
    
    saveToStorage("cr_cart", cart);
    updateCartUI();
    renderProducts();
    showToast("success", "Added to Cart", `${qtyToAdd} box(es) of ${product.name}`);
  }

  function removeFromCart(productId) {
    cart = cart.filter((item) => item.id !== productId);
    saveToStorage("cr_cart", cart);
    updateCartUI();
    renderProducts();
  }

  function updateQty(productId, delta) {
    const item = cart.find((i) => i.id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) { removeFromCart(productId); return; }
    saveToStorage("cr_cart", cart);
    updateCartUI();
  }

  function getCartItemCount() { return cart.reduce((sum, item) => sum + item.qty, 0); }

  function updateCartUI() {
    const count = getCartItemCount();
    cartBadge.textContent = count;
    cartBadge.classList.toggle("visible", count > 0);
    cartFooter.style.display = count > 0 ? "block" : "none";
    cartItemCount.textContent = count;
    cartTotal.textContent = `${count} Boxes`;

    if (count === 0) {
      cartItemsEl.innerHTML = `
        <div class="cart-empty">
          <div class="empty-icon">🛒</div>
          <p>Your cart is empty</p>
          <div class="empty-hint" style="font-size:0.8rem;color:var(--text-muted);">Browse products and add them here</div>
        </div>`;
      return;
    }

    cartItemsEl.innerHTML = cart.map((item) => {
      const p = products.find((pr) => pr.id === item.id);
      if (!p) return "";
      return `
      <div class="cart-item" data-cart-id="${item.id}">
        <div class="cart-item-image"><img src="${p.image}" alt="${p.name}" /></div>
        <div class="cart-item-details">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-meta">${p.packaging} · ${p.id}</div>
          <div class="cart-item-controls">
            <div class="qty-controls">
              <button class="qty-btn" data-action="decrease" data-id="${item.id}">−</button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
            </div>
            <span class="cart-item-price" style="font-size:0.8rem; color:var(--text-muted);">Units</span>
          </div>
          <button class="remove-item-btn" data-id="${item.id}">Remove</button>
        </div>
      </div>`;
    }).join("");
  }

  function openCart() { cartOverlay.classList.add("open"); cartPanel.classList.add("open"); document.body.style.overflow = "hidden"; }
  function closeCart() { cartOverlay.classList.remove("open"); cartPanel.classList.remove("open"); document.body.style.overflow = ""; }

  // ── Customer Login (Phone Number Only) ─────────────────
  let loginIntent = null;
  let pendingCartAction = null;

  function openCustomerLogin(intent = null, productId = null) {
    loginIntent = intent;
    pendingCartAction = productId;
    
    if (intent === "checkout") {
      customerLoginBtn.textContent = "Login & Place Order";
    } else if (intent === "add_to_cart") {
      customerLoginBtn.textContent = "Login & Add to Cart";
    } else {
      customerLoginBtn.textContent = "Login";
    }
    
    customerModal.classList.add("open");
    document.body.style.overflow = "hidden";
    showCustomerStep("phone");
    if (currentUser) {
      phoneInput.value = currentUser.phone || "";
      customerNameInput.value = currentUser.name || "";
    }
    validateCustomerForm();
  }

  function closeCustomerLogin() {
    customerModal.classList.remove("open");
    document.body.style.overflow = "";
  }

  function showCustomerStep(step) {
    stepPhone.classList.remove("active");
    stepSuccess.classList.remove("active");
    if (step === "phone") stepPhone.classList.add("active");
    if (step === "success") stepSuccess.classList.add("active");
  }

  function validateCustomerForm() {
    const phone = phoneInput.value.replace(/\D/g, "");
    const name = customerNameInput.value.trim();
    customerLoginBtn.disabled = phone.length < 10 || name.length < 2;
  }

  function customerLogin() {
    const name = customerNameInput.value.trim();
    const phone = phoneInput.value.trim();
    if (!name || !phone) return;

    currentUser = { name, phone, loggedInAt: new Date().toISOString() };
    saveToStorage("cr_user", currentUser);
    updateUserButton();

    if (loginIntent === "add_to_cart" && pendingCartAction) {
      closeCustomerLogin();
      addToCart(pendingCartAction);
      cartBadge.style.transform = "scale(1.3)";
      setTimeout(() => (cartBadge.style.transform = ""), 200);
      loginIntent = null;
      pendingCartAction = null;
    } else if (loginIntent === "checkout") {
      placeOrder();
    } else {
      closeCustomerLogin();
      showToast("success", "Logged In", "Welcome to Chems Root");
    }
  }

  let lastPlacedOrder = null;
  let editingOrderId = null;

  // ── Place Order ────────────────────────────────────────
  async function placeOrder() {
    const orderId = editingOrderId || ("ORD-" + Date.now().toString(36).toUpperCase());
    const orderItems = cart.map((item) => {
      const p = products.find((pr) => pr.id === item.id);
      return {
        id: item.id,
        name: p ? p.name : "Unknown",
        qty: item.qty,
        category: p ? p.category : ""
      };
    });

    const totalBoxes = getCartItemCount();

    const order = {
      orderId,
      customer: { ...currentUser },
      items: orderItems,
      totalBoxes: totalBoxes,
      itemCount: orderItems.length,
      placedAt: new Date().toISOString(),
      status: "pending",
    };

    if (editingOrderId) {
      const idx = orders.findIndex(o => o.orderId === editingOrderId);
      if (idx !== -1) orders[idx] = order;
      else orders.push(order);
      editingOrderId = null; // reset
    } else {
      orders.push(order);
    }
    saveToStorage("cr_orders", orders);

    if (useRemote && supabaseClient) {
      const dbOrder = { 
        order_id: order.orderId,
        customer: order.customer,
        items: order.items,
        total_boxes: order.totalBoxes,
        item_count: order.itemCount,
        placed_at: order.placedAt,
        status: order.status
      };
      const { error } = await supabaseClient.from('orders').upsert([dbOrder]);
      if (error) console.error("Could not save order to Supabase:", error);
    }

    lastPlacedOrder = order;
    renderOrderConfirmation(order);
    showCustomerStep("success");

    cart = [];
    saveToStorage("cr_cart", cart);
    updateCartUI();
    renderProducts();
    closeCart();

    showToast("success", "Order Confirmed!", `Order ${orderId} saved.`);
    console.log("📦 ORDER SAVED:", order);
  }

  function generateReceiptHTML(order) {
    return `
      <div class="receipt-wrapper" style="width: 600px; box-sizing: border-box; background: #fff;">
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
            <div><strong>Date:</strong> ${formatDate(order.placedAt).split(',')[0]}</div>
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
              <th style="width: 50px;">S.No</th>
              <th>Product Details</th>
              <th>Ordered Qty</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>
                  <div class="receipt-item-desc">${item.name}</div>
                  <div class="receipt-item-cat">${item.category || item.id}</div>
                </td>
                <td>${item.qty} Boxes</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="receipt-total">
          <span class="total-label">Total Quantities Ordered</span>
          <span class="total-value">${order.totalBoxes} Boxes</span>
        </div>
      </div>
    `;
  }

  function renderOrderConfirmation(order) {
    orderConfirmation.innerHTML = generateReceiptHTML(order);
  }

  // ── Customer Dashboard ─────────────────────────────────
  function openCustomerDashboard() {
    customerDashboardModal.classList.add("open");
    document.body.style.overflow = "hidden";
    dashboardUserInfo.innerHTML = `<strong>${currentUser.name}</strong><br/>${currentUser.phone}`;
    renderCustomerOrders();
  }

  function closeCustomerDashboard() {
    customerDashboardModal.classList.remove("open");
    document.body.style.overflow = "";
  }

  function renderCustomerOrders() {
    const myOrders = orders.filter(o => o.customer.phone === currentUser.phone).reverse();
    
    if (myOrders.length === 0) {
      customerOrdersList.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:20px;">You haven't placed any orders yet.</p>`;
      return;
    }

    customerOrdersList.innerHTML = myOrders.map(order => `
      <div class="admin-order" id="my-order-${order.orderId}">
        <div class="admin-order-header" style="background:#f3f4f6;">
          <span class="admin-order-id">${order.orderId}</span>
          <span class="admin-order-date">${formatDate(order.placedAt)}</span>
        </div>
        <div class="admin-order-items" style="padding:10px;">
          ${order.items.map(item => `
            <div class="admin-order-item" style="border-bottom:1px solid #eee; padding:5px 0;">
              <span>${item.name}</span>
              <span style="font-weight:bold;">×${item.qty} Boxes</span>
            </div>`).join("")}
        </div>
        <div class="admin-order-total" style="padding:10px; font-weight:bold;">
          <span>Total Quantities</span>
          <span>${order.totalBoxes} Boxes</span>
        </div>
        <div style="padding:10px; border-top:1px solid #eee; display:flex; gap:10px; justify-content:flex-end;">
           <button class="modal-btn secondary" style="padding:4px 8px; font-size:0.8rem; width:auto; margin:0;" onclick="appEditOrder('${order.orderId}')">✏️ Edit</button>
           <button class="modal-btn secondary" style="padding:4px 8px; font-size:0.8rem; width:auto; margin:0;" onclick="appSaveReceipt('${order.orderId}')">📸 Save</button>
           <button class="modal-btn" style="background:#25D366; padding:4px 8px; font-size:0.8rem; width:auto; margin:0;" onclick="appShareWhatsApp('${order.orderId}')">💬 Share</button>
        </div>
      </div>`).join("");
  }

  // Exposed globals for inline onclicks in dashboard
  window.appEditOrder = function(orderId) {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;
    
    // Load into cart
    cart = order.items.map(i => ({ id: i.id, qty: i.qty }));
    saveToStorage("cr_cart", cart);
    updateCartUI();
    
    editingOrderId = order.orderId;
    closeCustomerDashboard();
    openCart();
    showToast("info", "Editing Order", `You are now editing ${orderId}. Cart updated.`);
  };
  window.appSaveReceipt = function(orderId) {
    const order = orders.find(o => o.orderId === orderId);
    if (order) downloadReceiptImage(null, order);
  };

  window.appShareWhatsApp = function(orderId) {
    const order = orders.find(o => o.orderId === orderId);
    if (order) shareOrderWhatsApp(order);
  };

  function downloadReceiptImage(element, order) {
    if (!window.html2canvas) {
      showToast("error", "Error", "html2canvas library not loaded.");
      return;
    }
    
    // Create a temporary off-screen container to render the professional receipt
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "-9999px";
    tempContainer.innerHTML = generateReceiptHTML(order);
    document.body.appendChild(tempContainer);
    
    // The actual element to capture
    const captureEl = tempContainer.firstElementChild;
    
    html2canvas(captureEl, { scale: 2, backgroundColor: "#ffffff" }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Invoice_${order.orderId}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.9);
      link.click();
      showToast("success", "Receipt Saved", "The invoice has been downloaded.");
      document.body.removeChild(tempContainer);
    }).catch(err => {
      console.error(err);
      showToast("error", "Error", "Could not save receipt image.");
      document.body.removeChild(tempContainer);
    });
  }

  function shareOrderWhatsApp(order) {
    let text = `*Chems Root Pharmaceutical Order*\n\n`;
    text += `*Order ID:* ${order.orderId}\n`;
    text += `*Customer:* ${order.customer.name} (${order.customer.phone})\n\n`;
    text += `*Items:*\n`;
    order.items.forEach(item => {
      text += `- ${item.name} x${item.qty} Boxes\n`;
    });
    text += `\n*Total Units:* ${order.totalBoxes} Boxes`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  // ── Admin Login (Username + Password) ──────────────────
  function openAdminLogin() {
    adminLoginModal.classList.add("open");
    document.body.style.overflow = "hidden";
    adminLoginError.textContent = "";
    adminUsername.value = "";
    adminPassword.value = "";
    adminLoginBtn.disabled = true;
  }

  function closeAdminLogin() {
    adminLoginModal.classList.remove("open");
    document.body.style.overflow = "";
  }

  function validateAdminForm() {
    adminLoginBtn.disabled = !adminUsername.value.trim() || !adminPassword.value.trim();
  }

  function attemptAdminLogin() {
    const user = adminUsername.value.trim();
    const pass = adminPassword.value.trim();

    if (user === ADMIN_CREDENTIALS.username && pass === ADMIN_CREDENTIALS.password) {
      isAdmin = true;
      closeAdminLogin();
      openAdminPanel();
      showToast("success", "Admin Login", "Welcome to the dashboard");
    } else {
      adminLoginError.textContent = "❌ Invalid username or password";
      adminPassword.value = "";
      adminLoginBtn.disabled = true;
    }
  }

  // ── Admin Panel ────────────────────────────────────────
  function openAdminPanel() {
    adminPanel.classList.add("open");
    document.body.style.overflow = "hidden";
    switchAdminTab("products");
    renderAdminProducts();
    renderAdminOrders();
  }

  function closeAdminPanel() {
    adminPanel.classList.remove("open");
    document.body.style.overflow = "";
  }

  function switchAdminTab(tab, skipReset) {
    adminTabBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
    adminProductsTab.classList.toggle("active", tab === "products");
    adminOrdersTab.classList.toggle("active", tab === "orders");
    adminAddTab.classList.toggle("active", tab === "add");

    if (tab === "add" && !skipReset) {
      // Reset form for new product
      resetAdminForm();
    }
    if (tab === "products") renderAdminProducts();
    if (tab === "orders") renderAdminOrders();
  }

  // ── Admin Filters ──────────────────────────────────────
  function populateAdminFilters() {
    // Category filter
    adminCategoryFilterEl.innerHTML =
      '<option value="All">All Categories</option>' +
      dynamicCategories.filter((c) => c !== "All")
        .map((c) => `<option value="${c}">${c}</option>`)
        .join("");

    // Label filter
    adminLabelFilterEl.innerHTML =
      '<option value="All">All Labels</option>' +
      dynamicLabels.filter((l) => l !== "All")
        .map((l) => `<option value="${l}">${l}</option>`)
        .join("");

    // Form selects
    if (formCategory) {
      formCategory.innerHTML =
        '<option value="">Select Category</option>' +
        dynamicCategories.filter((c) => c !== "All")
          .map((c) => `<option value="${c}">${c}</option>`)
          .join("") + '<option value="Custom...">Custom...</option>';
    }

    if (formLabelSelect) {
      formLabelSelect.innerHTML =
        '<option value="">Select Label to Add...</option>' +
        dynamicLabels.filter((l) => l !== "All" && !currentFormLabels.includes(l))
          .map((l) => `<option value="${l}">${l}</option>`)
          .join("") + '<option value="Custom...">Custom Label...</option>';
    }
  }

  // ── Admin: Render Products Table ───────────────────────
  function renderAdminProducts() {
    let list = products;

    if (adminCategoryFilter !== "All") list = list.filter((p) => p.category === adminCategoryFilter);
    if (adminLabelFilter !== "All") list = list.filter((p) => p.labels && p.labels.includes(adminLabelFilter));
    if (adminSearch.trim()) {
      const q = adminSearch.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.composition.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    }

    if (list.length === 0) {
      adminProductsTbody.innerHTML = `
        <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">
          No products found
        </td></tr>`;
      return;
    }

    adminProductsTbody.innerHTML = list.map((p) => {
      const pLabels = p.labels || (p.label ? [p.label] : ["General"]);
      return `
      <tr>
        <td><code style="font-size:0.7rem;color:var(--text-muted);">${p.id}</code></td>
        <td class="product-name-cell">${p.name}</td>
        <td class="composition-cell">${p.composition}</td>
        <td>${p.category}</td>
        <td>
          <div style="display:flex; flex-wrap:wrap; gap:4px;">
            ${(p.labels || ["General"]).map(lbl => {
              const c = LABEL_COLORS[lbl] || LABEL_COLORS.General;
              return `<span class="label-cell-tag" style="background:${c.bg};color:${c.text};border-color:${c.border};">${lbl}</span>`;
            }).join("")}
          </div>
        </td>
        <td class="price-cell">₹${p.price.toFixed(2)}</td>
        <td>
          <div class="admin-actions-cell">
            <button class="admin-action-btn edit" data-edit-id="${p.id}">✏️ Edit</button>
            <button class="admin-action-btn delete" data-delete-id="${p.id}">🗑️ Delete</button>
          </div>
        </td>
      </tr>`;
    }).join("");
  }

  // ── Admin: Render Orders ───────────────────────────────
  function renderAdminOrders() {
    orders = loadFromStorage("cr_orders", []);

    if (orders.length === 0) {
      adminOrdersContent.innerHTML = `
        <div class="admin-empty">
          <div class="empty-icon">📋</div>
          <p>No orders yet</p>
          <p style="font-size:0.85rem;color:var(--text-muted);">Orders placed by customers will appear here.</p>
        </div>`;
      return;
    }

    const sorted = [...orders].reverse();
    adminOrdersContent.innerHTML = sorted.map((order) => `
      <div class="admin-order">
        <div class="admin-order-header">
          <span class="admin-order-id">${order.orderId}</span>
          <span class="admin-order-date">${formatDate(order.placedAt)}</span>
        </div>
        <div class="admin-order-customer">
          <strong>${order.customer.name}</strong> · 📱 ${order.customer.phone}
        </div>
        <div class="admin-order-items">
          ${order.items.map((item) => `
            <div class="admin-order-item">
              <span>${item.name}</span>
              <span style="font-weight:bold;">×${item.qty} Boxes</span>
            </div>`).join("")}
        </div>
        <div class="admin-order-total">
          <span>Total Quantities</span>
          <span>${order.totalBoxes} Boxes</span>
        </div>
      </div>`).join("");
  }

  // ── Admin: Add/Edit Product Form ───────────────────────
  function resetAdminForm() {
    formEditId.value = "";
    formProductId.value = "";
    formProductName.value = "";
    formComposition.value = "";
    formDescription.value = "";
    formCategory.value = "";
    if (formLabelSelect) formLabelSelect.value = "";
    formPrice.value = "";
    formPackaging.value = "";
    formBadge.value = "";
    formImageInput.value = "";
    formImagePreview.style.display = "none";
    formImagePreview.src = "";
    uploadedImageDataUrl = null;
    formCustomCategory.value = "";
    formCustomCategory.style.display = "none";
    formCustomCategory.required = false;
    formCustomLabel.value = "";
    formCustomLabelWrap.style.display = "none";
    formLabelSelect.style.display = "block";
    currentFormLabels = [];
    renderFormLabels();
    formTitle.textContent = "Add New Product";
    formSubmitBtn.textContent = "Add Product";
    formProductId.disabled = false;
  }

  function editProduct(productId) {
    const p = products.find((pr) => pr.id === productId);
    if (!p) return;

    // Switch tab WITHOUT resetting form
    switchAdminTab("add", true);
    resetAdminForm();

    // Now populate
    formEditId.value = p.id;
    formProductId.value = p.id;
    formProductId.disabled = true;
    formProductName.value = p.name;
    formComposition.value = p.composition;
    formDescription.value = p.description;

    // Set labels first (this calls populateAdminFilters which rebuilds selects)
    currentFormLabels = p.labels ? [...p.labels] : ["General"];
    renderFormLabels();

    // Set category AFTER renderFormLabels has rebuilt the select options
    formCategory.value = p.category;
    formPrice.value = p.price;
    formPackaging.value = p.packaging;
    formBadge.value = p.badge || "";

    if (p.image && !p.image.startsWith("assets/")) {
      uploadedImageDataUrl = p.image;
      formImagePreview.src = p.image;
      formImagePreview.style.display = "block";
    } else {
      uploadedImageDataUrl = null;
      formImagePreview.style.display = "none";
      formImagePreview.src = "";
    }
    formTitle.textContent = `Edit Product — ${p.id}`;
    formSubmitBtn.textContent = "Save Changes";
  }

  let pendingDeleteId = null;

  function deleteProduct(productId) {
    const p = products.find((pr) => pr.id === productId);
    if (!p) return;
    pendingDeleteId = productId;
    showDeleteModal(p.name, p.id);
  }

  function showDeleteModal(name, id) {
    let modal = document.getElementById("delete-confirm-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "delete-confirm-modal";
      modal.className = "modal-overlay";
      modal.innerHTML = `
        <div class="modal" style="max-width:420px;text-align:center;">
          <div style="font-size:2.5rem;margin-bottom:12px;">🗑️</div>
          <h3 style="margin-bottom:8px;" id="delete-modal-title">Delete Product?</h3>
          <p style="color:var(--text-muted);margin-bottom:20px;" id="delete-modal-msg"></p>
          <div style="display:flex;gap:12px;justify-content:center;">
            <button class="modal-btn" id="delete-confirm-yes" style="background:var(--error);width:auto;padding:10px 28px;">Delete</button>
            <button class="modal-btn secondary" id="delete-confirm-no" style="width:auto;padding:10px 28px;">Cancel</button>
          </div>
        </div>`;
      document.body.appendChild(modal);

      document.getElementById("delete-confirm-yes").addEventListener("click", () => {
        if (pendingDeleteId) confirmDelete(pendingDeleteId);
        closeDeleteModal();
      });
      document.getElementById("delete-confirm-no").addEventListener("click", closeDeleteModal);
      modal.addEventListener("click", (e) => { if (e.target === modal) closeDeleteModal(); });
    }
    document.getElementById("delete-modal-msg").textContent = `"${name}" (${id}) — This action cannot be undone.`;
    modal.classList.add("open");
  }

  function closeDeleteModal() {
    const modal = document.getElementById("delete-confirm-modal");
    if (modal) modal.classList.remove("open");
    pendingDeleteId = null;
  }

  async function confirmDelete(productId) {
    const p = products.find((pr) => pr.id === productId);
    if (!p) return;

    if (useRemote && supabaseClient) {
      const { error } = await supabaseClient.from('products').delete().eq('id', productId);
      if (error) {
        showToast("error", "Database Error", "Could not delete product.");
        return;
      }
    }

    products = products.filter((pr) => pr.id !== productId);
    saveToStorage("cr_products", products);

    // Also remove from cart if present
    cart = cart.filter((item) => item.id !== productId);
    saveToStorage("cr_cart", cart);

    renderProducts();
    updateCartUI();
    renderAdminProducts();

    showToast("info", "Product Deleted", p.name);
  }

  async function saveProduct(e) {
    e.preventDefault();

    const id = formProductId.value.trim();
    const name = formProductName.value.trim();
    const composition = formComposition.value.trim();
    const description = formDescription.value.trim();
    let category = formCategory.value;
    
    if (category === "Custom...") {
      category = formCustomCategory.value.trim();
      if (category && !dynamicCategories.includes(category)) {
        dynamicCategories.push(category);
        saveToStorage("cr_categories", dynamicCategories);
      }
    }

    const labels = [...currentFormLabels];

    const price = parseFloat(formPrice.value);
    const packaging = formPackaging.value.trim();
    const badge = formBadge.value;
    const editId = formEditId.value;

    let fallbackImage = CATEGORY_IMAGES[category] || "assets/pharma_tablets.png";
    let image = fallbackImage;

    if (editId) {
      const idx = products.findIndex((p) => p.id === editId);
      if (idx !== -1 && products[idx].image && !products[idx].image.startsWith("assets/")) {
         image = uploadedImageDataUrl || products[idx].image;
      } else {
         image = uploadedImageDataUrl || fallbackImage; 
      }
    } else {
      image = uploadedImageDataUrl || fallbackImage;
    }

    if (!id || !name || !composition || !description || !category || labels.length === 0 || isNaN(price) || !packaging) {
      showToast("warning", "Missing Fields", "Please fill in all required fields and add at least one label.");
      return;
    }

    if (editId) {
      // Update existing product
      const idx = products.findIndex((p) => p.id === editId);
      if (idx !== -1) {
        products[idx] = { ...products[idx], name, composition, description, category, labels, price, packaging, badge, image };
        showToast("success", "Product Updated", name);
      }
    } else {
      // Check for duplicate ID
      if (products.some((p) => p.id === id)) {
        showToast("error", "Duplicate ID", `Product ID "${id}" already exists`);
        return;
      }

      products.push({ id, name, composition, description, category, labels, price, packaging, badge, image });
      showToast("success", "Product Added", name);
    }

    saveToStorage("cr_products", products);

    if (useRemote && supabaseClient) {
      const dbProd = {
         id, name, composition, description, category, labels, price, packaging, badge, image
      };
      const { error } = await supabaseClient.from('products').upsert([dbProd]);
      if (error) {
        showToast("error", "Database Error", "Saved locally, but could not save to Supabase.");
        console.error(error);
      }
    }

    populateAdminFilters();
    renderLabelPills();
    renderFilterPills();
    renderProducts();
    renderAdminProducts();
    resetAdminForm();
    switchAdminTab("products");
  }

  // ── Toast ──────────────────────────────────────────────
  function showToast(type, title, message, duration = 3500) {
    const icons = { success: "✅", info: "ℹ️", warning: "⚠️", error: "❌" };
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || "ℹ️"}</span>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ""}
      </div>`;
    toastContainer.appendChild(toast);
    setTimeout(() => { toast.classList.add("exit"); setTimeout(() => toast.remove(), 300); }, duration);
  }

  // ── Helpers ────────────────────────────────────────────
  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  // ── Event Bindings ─────────────────────────────────────
  function bindEvents() {

    // ── Catalog: Label filters ──
    labelPills.addEventListener("click", (e) => {
      const pill = e.target.closest(".label-pill");
      if (!pill) return;
      currentLabel = pill.dataset.label;
      renderLabelPills();
      renderProducts();
    });

    // ── Catalog: Category filters ──
    filterPills.addEventListener("click", (e) => {
      const pill = e.target.closest(".filter-pill");
      if (!pill) return;
      currentCategory = pill.dataset.category;
      renderFilterPills();
      renderProducts();
    });

    // ── Catalog: Search ──
    let searchDebounce;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        searchQuery = searchInput.value;
        renderProducts();
      }, 200);
    });

    // ── Catalog: Add to cart ──
    productGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".add-to-cart-btn");
      if (!btn) return;
      const id = btn.dataset.id;
      
      const input = document.getElementById(`qty-${id}`);
      const newQty = input ? (parseInt(input.value) || 1) : 1;

      if (isInCart(id)) {
        // Update existing quantity directly from catalog
        const existing = cart.find(item => item.id === id);
        if (existing) {
          existing.qty = newQty;
          saveToStorage("cr_cart", cart);
          updateCartUI();
          renderProducts(); // Re-render to show updated state
          showToast("success", "Cart Updated", `Updated to ${newQty} box(es)`);
          
          cartBadge.style.transform = "scale(1.3)";
          setTimeout(() => (cartBadge.style.transform = ""), 200);
        }
      } else {
        addToCart(id, newQty);
        cartBadge.style.transform = "scale(1.3)";
        setTimeout(() => (cartBadge.style.transform = ""), 200);
      }
    });

    // ── Cart ──
    cartToggle.addEventListener("click", openCart);
    cartOverlay.addEventListener("click", closeCart);
    closeCartBtn.addEventListener("click", closeCart);

    cartItemsEl.addEventListener("click", (e) => {
      const qtyBtn = e.target.closest(".qty-btn");
      const removeBtn = e.target.closest(".remove-item-btn");
      if (qtyBtn) {
        updateQty(qtyBtn.dataset.id, qtyBtn.dataset.action === "increase" ? 1 : -1);
      }
      if (removeBtn) {
        const p = products.find((pr) => pr.id === removeBtn.dataset.id);
        removeFromCart(removeBtn.dataset.id);
        showToast("info", "Removed", p ? p.name : "Item removed");
      }
    });

    // ── Checkout → Customer Login ──
    checkoutBtn.addEventListener("click", () => {
      if (cart.length === 0) return;
      closeCart();
      
      if (currentUser) {
        placeOrder();
      } else {
        setTimeout(() => openCustomerLogin("checkout"), 300);
      }
    });

    // ── Customer Login Modal ──
    customerModalClose.addEventListener("click", closeCustomerLogin);
    customerModal.addEventListener("click", (e) => { if (e.target === customerModal) closeCustomerLogin(); });
    phoneInput.addEventListener("input", validateCustomerForm);
    customerNameInput.addEventListener("input", validateCustomerForm);
    customerLoginBtn.addEventListener("click", customerLogin);
    continueShoppingBtn.addEventListener("click", closeCustomerLogin);

    // ── Success Step Buttons (Save/Share) ──
    if (btnSaveReceipt) {
      btnSaveReceipt.addEventListener("click", () => {
        if (lastPlacedOrder) downloadReceiptImage(null, lastPlacedOrder);
      });
    }
    if (btnShareWa) {
      btnShareWa.addEventListener("click", () => {
        if (lastPlacedOrder) shareOrderWhatsApp(lastPlacedOrder);
      });
    }

    // ── Customer Dashboard Modal ──
    if (customerDashboardClose) customerDashboardClose.addEventListener("click", closeCustomerDashboard);
    if (customerDashboardModal) customerDashboardModal.addEventListener("click", (e) => { if (e.target === customerDashboardModal) closeCustomerDashboard(); });
    if (customerLogoutBtn) {
      customerLogoutBtn.addEventListener("click", () => {
        currentUser = null;
        saveToStorage("cr_user", null);
        updateUserButton();
        closeCustomerDashboard();
        showToast("info", "Logged Out", "You have been securely logged out.");
      });
    }

    // ── User button ──
    userBtn.addEventListener("click", () => {
      if (currentUser) {
        openCustomerDashboard();
      } else {
        openCustomerLogin();
      }
    });

    // ── Admin Toggle → Admin Login ──
    adminToggle.addEventListener("click", () => {
      if (isAdmin) {
        openAdminPanel();
      } else {
        openAdminLogin();
      }
    });

    // ── Admin Login Modal ──
    adminLoginClose.addEventListener("click", closeAdminLogin);
    adminLoginModal.addEventListener("click", (e) => { if (e.target === adminLoginModal) closeAdminLogin(); });
    adminUsername.addEventListener("input", validateAdminForm);
    adminPassword.addEventListener("input", validateAdminForm);
    adminLoginBtn.addEventListener("click", attemptAdminLogin);
    adminPassword.addEventListener("keydown", (e) => { if (e.key === "Enter" && !adminLoginBtn.disabled) attemptAdminLogin(); });

    // ── Admin Panel ──
    closeAdminBtn.addEventListener("click", closeAdminPanel);

    // Admin tabs
    adminTabBtns.forEach((btn) => {
      btn.addEventListener("click", () => switchAdminTab(btn.dataset.tab));
    });

    // Admin product search
    let adminSearchDebounce;
    adminProductSearch.addEventListener("input", () => {
      clearTimeout(adminSearchDebounce);
      adminSearchDebounce = setTimeout(() => {
        adminSearch = adminProductSearch.value;
        renderAdminProducts();
      }, 200);
    });

    // Admin category filter
    adminCategoryFilterEl.addEventListener("change", () => {
      adminCategoryFilter = adminCategoryFilterEl.value;
      renderAdminProducts();
    });

    // Admin label filter
    adminLabelFilterEl.addEventListener("change", () => {
      adminLabelFilter = adminLabelFilterEl.value;
      renderAdminProducts();
    });

    // Admin product table actions (edit/delete)
    adminProductsTbody.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".admin-action-btn.edit");
      const deleteBtn = e.target.closest(".admin-action-btn.delete");
      if (editBtn) editProduct(editBtn.dataset.editId);
      if (deleteBtn) deleteProduct(deleteBtn.dataset.deleteId);
    });

    // Admin form custom fields toggle
    formCategory.addEventListener("change", (e) => {
      if (e.target.value === "Custom...") {
        formCustomCategory.style.display = "block";
        formCustomCategory.required = true;
      } else {
        formCustomCategory.style.display = "none";
        formCustomCategory.required = false;
      }
    });

    formLabelSelect.addEventListener("change", (e) => {
      const val = e.target.value;
      if (!val) return;
      if (val === "Custom...") {
        formCustomLabelWrap.style.display = "flex";
        formLabelSelect.style.display = "none";
      } else {
        if (!currentFormLabels.includes(val)) {
          currentFormLabels.push(val);
          renderFormLabels();
        }
      }
      formLabelSelect.value = "";
    });

    formCancelCustomLabelBtn.addEventListener("click", () => {
      formCustomLabelWrap.style.display = "none";
      formLabelSelect.style.display = "block";
      formCustomLabel.value = "";
    });

    formAddLabelBtn.addEventListener("click", () => {
      const val = formCustomLabel.value.trim();
      if (!val) return;
      if (!dynamicLabels.includes(val)) {
        dynamicLabels.push(val);
        saveToStorage("cr_labels", dynamicLabels);
      }
      if (!currentFormLabels.includes(val)) {
        currentFormLabels.push(val);
        renderFormLabels();
      }
      formCustomLabelWrap.style.display = "none";
      formLabelSelect.style.display = "block";
      formCustomLabel.value = "";
    });

    // Admin form
    formImageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) {
        uploadedImageDataUrl = null;
        formImagePreview.style.display = "none";
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400; // Web-friendly size
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          uploadedImageDataUrl = canvas.toDataURL("image/jpeg", 0.7); // Convert to JPEG 70% to save space
          formImagePreview.style.display = "block";
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });

    adminProductForm.addEventListener("submit", saveProduct);
    formCancelBtn.addEventListener("click", () => {
      resetAdminForm();
      switchAdminTab("products");
    });

    // ── Admin Bulk Upload ──
    const adminBulkUploadBtn = $("#admin-bulk-upload-btn");
    const adminBulkSampleBtn = $("#admin-bulk-sample-btn");
    const adminBulkUploadInput = $("#admin-bulk-upload-input");

    if (adminBulkSampleBtn) {
      adminBulkSampleBtn.addEventListener("click", () => {
        const header = "ID,Name,Composition,Description,Price,Category,Labels,Packaging,Badge\n";
        const sampleRow1 = "CR-TAB-101,New Paracetamol 500mg,Paracetamol IP 500mg,Effective relief from fever.,35.00,Tablets,General,Strip of 10 tablets,New\n";
        const sampleRow2 = "CR-SYR-102,Cough Syrup,Dextromethorphan,Relief from cough.,75.00,Syrups,General;Pediatric,100ml bottle,\n";
        
        const blob = new Blob([header + sampleRow1 + sampleRow2], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_products.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });
    }

    if (adminBulkUploadBtn && adminBulkUploadInput) {
      adminBulkUploadBtn.addEventListener("click", () => adminBulkUploadInput.click());
      adminBulkUploadInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function(event) {
          try {
            const csvText = event.target.result;
            const lines = csvText.split('\n');
            if (lines.length < 2) throw new Error("File is empty or missing data rows.");

            function parseCSVLine(line) {
              const result = [];
              let current = '';
              let inQuotes = false;
              for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"' && line[i+1] === '"') { current += '"'; i++; }
                else if (char === '"') inQuotes = !inQuotes;
                else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
                else current += char;
              }
              result.push(current);
              return result.map(s => s.trim());
            }

            let added = 0, updated = 0;
            const newProducts = [];
            
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              const cols = parseCSVLine(line);
              if (cols.length < 8) continue;

              const id = cols[0], name = cols[1], composition = cols[2], description = cols[3];
              const price = parseFloat(cols[4]), category = cols[5], labelsRaw = cols[6];
              const packaging = cols[7], badge = cols[8] || "";
              if (!id || !name) continue;

              const labelsArray = labelsRaw ? labelsRaw.split(';').map(l => l.trim()).filter(l => l) : ["General"];
              let image = CATEGORY_IMAGES[category] || "assets/pharma_tablets.png";

              newProducts.push({ id, name, composition, description, price: isNaN(price) ? 0 : price, category, labels: labelsArray, image, packaging, badge });
              if (category && !dynamicCategories.includes(category)) dynamicCategories.push(category);
              labelsArray.forEach(l => { if (!dynamicLabels.includes(l)) dynamicLabels.push(l); });
            }

            if (newProducts.length === 0) throw new Error("No valid products found.");

            newProducts.forEach(newP => {
              const idx = products.findIndex(p => p.id === newP.id);
              if (idx >= 0) {
                if (products[idx].image && !products[idx].image.startsWith("assets/")) newP.image = products[idx].image;
                products[idx] = newP;
                updated++;
              } else {
                products.push(newP);
                added++;
              }
            });

            saveToStorage('cr_products', products);
            saveToStorage('cr_categories', dynamicCategories);
            saveToStorage('cr_labels', dynamicLabels);
            
            if (useRemote && supabaseClient) {
              showToast("info", "Syncing", "Syncing with database...");
              const { error } = await supabaseClient.from('products').upsert(newProducts);
              if (error) {
                showToast("error", "Database Sync Error", "Saved locally, but failed to sync with database.");
                console.error(error);
              } else {
                showToast("success", "Database Synced", "All products successfully synced to database.");
              }
            }

            populateAdminFilters();
            renderLabelPills();
            renderFilterPills();
            renderProducts();
            renderAdminProducts();

            showToast("success", "Bulk Upload Complete", `Added: ${added}, Updated: ${updated}`);
            adminBulkUploadInput.value = "";
          } catch(err) {
            showToast("error", "Upload Failed", err.message);
          }
        };
        reader.readAsText(file);
      });
    }

    // ── Image Zoom Modal ──
    const imageZoomModal = $("#image-zoom-modal");
    const imageZoomContent = $("#image-zoom-content");
    const imageZoomClose = $("#image-zoom-close");

    productGrid.addEventListener("click", (e) => {
      // If clicking on an image inside the product card
      if (e.target.tagName === "IMG" && e.target.closest(".card-image")) {
        imageZoomContent.src = e.target.src;
        imageZoomModal.classList.add("open");
        document.body.style.overflow = "hidden"; // Prevent scrolling behind modal
      }
    });

    imageZoomModal.addEventListener("click", (e) => {
      // Close if clicking outside the image or on the close button
      if (e.target === imageZoomModal || e.target === imageZoomClose) {
        imageZoomModal.classList.remove("open");
        document.body.style.overflow = "";
        // Optional: Reset src after transition so it doesn't flash old image next time
        setTimeout(() => { if (!imageZoomModal.classList.contains("open")) imageZoomContent.src = ""; }, 200);
      }
    });

    // ── Keyboard ──
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (imageZoomModal.classList.contains("open")) {
          imageZoomModal.classList.remove("open");
          document.body.style.overflow = "";
        }
        else if (customerModal.classList.contains("open")) closeCustomerLogin();
        else if (adminLoginModal.classList.contains("open")) closeAdminLogin();
        else if (adminPanel.classList.contains("open")) closeAdminPanel();
        else if (cartPanel.classList.contains("open")) closeCart();
      }
    });
  }

  // ── Boot ───────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", init);
})();
