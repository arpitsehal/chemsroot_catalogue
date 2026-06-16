/* Application entry point: bootstraps render, wires all events. */
import { state, saveToStorage } from "./store.js";
import { dom } from "./dom.js";
import { showToast } from "./utils.js";
import { renderLabelPills, renderFilterPills, renderProducts, updateUserButton } from "./catalog.js";
import {
  addToCart,
  removeFromCart,
  updateQty,
  updateCartUI,
  openCart,
  closeCart,
  isInCart,
} from "./cart.js";
import {
  openCustomerLogin,
  closeCustomerLogin,
  validateCustomerForm,
  customerLogin,
  placeOrder,
  openCustomerDashboard,
  closeCustomerDashboard,
  editOrder,
  saveReceiptFor,
  shareWhatsAppFor,
  downloadReceiptImage,
  shareOrderWhatsApp,
} from "./customer.js";
import { downloadCatalogue, downloadImageCatalogue } from "./exports.js";
import {
  renderFormLabels,
  removeFormLabel,
  openAdminLogin,
  closeAdminLogin,
  validateAdminForm,
  attemptAdminLogin,
  openAdminPanel,
  closeAdminPanel,
  switchAdminTab,
  populateAdminFilters,
  renderAdminProducts,
  renderAdminOrders,
  editProduct,
  deleteProduct,
  saveProduct,
  resetAdminForm,
  handleImageUpload,
  downloadSampleCSV,
  handleBulkUpload,
} from "./admin.js";
import { useRemote, fetchProductsFromRemote, fetchOrdersFromRemote, seedSupabase } from "./supabase.js";

const debounce = (fn, ms) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

function pulseCartBadge() {
  dom.cartBadge.style.transform = "scale(1.3)";
  setTimeout(() => (dom.cartBadge.style.transform = ""), 200);
}

async function init() {
  // Paint immediately from local state — never block on the network.
  renderLabelPills();
  renderFilterPills();
  renderProducts();
  updateCartUI();
  updateUserButton();
  populateAdminFilters();
  bindEvents();

  // Sync from Supabase in the background, then refresh affected views.
  if (useRemote) {
    Promise.allSettled([fetchProductsFromRemote(), fetchOrdersFromRemote()]).then(() => {
      renderLabelPills();
      renderFilterPills();
      renderProducts();
      populateAdminFilters();
      if (state.isAdmin) {
        renderAdminProducts();
        renderAdminOrders();
      }
    });
  }
}

function bindEvents() {
  // ── Catalog: label filters ──
  dom.labelPills.addEventListener("click", (e) => {
    const pill = e.target.closest(".label-pill");
    if (!pill) return;
    state.currentLabel = pill.dataset.label;
    renderLabelPills();
    renderProducts();
  });

  // ── Catalog: category filters ──
  dom.filterPills.addEventListener("click", (e) => {
    const pill = e.target.closest(".filter-pill");
    if (!pill) return;
    state.currentCategory = pill.dataset.category;
    renderFilterPills();
    renderProducts();
  });

  // ── Catalog: search (debounced) ──
  dom.searchInput.addEventListener(
    "input",
    debounce(() => {
      state.searchQuery = dom.searchInput.value;
      renderProducts();
    }, 200)
  );

  // ── Catalog: download buttons ──
  dom.downloadCatalogueBtn?.addEventListener("click", downloadCatalogue);
  dom.downloadImageCatalogueBtn?.addEventListener("click", downloadImageCatalogue);

  // ── Catalog: add to cart / update qty ──
  dom.productGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-to-cart-btn");
    if (!btn) return;
    const id = btn.dataset.id;
    const input = document.getElementById(`qty-${id}`);
    const newQty = input ? parseInt(input.value) || 1 : 1;

    if (isInCart(id)) {
      const existing = state.cart.find((item) => item.id === id);
      if (existing) {
        existing.qty = newQty;
        saveToStorage("cr_cart", state.cart);
        updateCartUI();
        showToast("success", "Cart Updated", `Updated to ${newQty} box(es)`);
        pulseCartBadge();
      }
    } else {
      addToCart(id, newQty);
      pulseCartBadge();
    }
  });

  // ── Catalog: image zoom ──
  dom.productGrid.addEventListener("click", (e) => {
    if (e.target.tagName === "IMG" && e.target.closest(".card-image")) {
      dom.imageZoomContent.src = e.target.src;
      dom.imageZoomModal.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  });

  dom.imageZoomModal.addEventListener("click", (e) => {
    if (e.target === dom.imageZoomModal || e.target === dom.imageZoomClose) {
      dom.imageZoomModal.classList.remove("open");
      document.body.style.overflow = "";
      setTimeout(() => {
        if (!dom.imageZoomModal.classList.contains("open")) dom.imageZoomContent.src = "";
      }, 200);
    }
  });

  // ── Cart panel ──
  dom.cartToggle.addEventListener("click", openCart);
  dom.cartOverlay.addEventListener("click", closeCart);
  dom.closeCartBtn.addEventListener("click", closeCart);

  dom.cartItemsEl.addEventListener("click", (e) => {
    const qtyBtn = e.target.closest(".qty-btn");
    const removeBtn = e.target.closest(".remove-item-btn");
    if (qtyBtn) updateQty(qtyBtn.dataset.id, qtyBtn.dataset.action === "increase" ? 1 : -1);
    if (removeBtn) {
      const p = state.products.find((pr) => pr.id === removeBtn.dataset.id);
      removeFromCart(removeBtn.dataset.id);
      showToast("info", "Removed", p ? p.name : "Item removed");
    }
  });

  // ── Checkout ──
  dom.checkoutBtn.addEventListener("click", () => {
    if (state.cart.length === 0) return;
    closeCart();
    if (state.currentUser) placeOrder();
    else setTimeout(() => openCustomerLogin("checkout"), 300);
  });

  // ── Customer login modal ──
  dom.customerModalClose.addEventListener("click", closeCustomerLogin);
  dom.customerModal.addEventListener("click", (e) => {
    if (e.target === dom.customerModal) closeCustomerLogin();
  });
  dom.phoneInput.addEventListener("input", validateCustomerForm);
  dom.customerNameInput.addEventListener("input", validateCustomerForm);
  dom.customerLoginBtn.addEventListener("click", customerLogin);
  dom.continueShoppingBtn.addEventListener("click", closeCustomerLogin);

  // ── Success step actions ──
  dom.btnSaveReceipt?.addEventListener("click", () => {
    if (state.lastPlacedOrder) downloadReceiptImage(state.lastPlacedOrder);
  });
  dom.btnShareWa?.addEventListener("click", () => {
    if (state.lastPlacedOrder) shareOrderWhatsApp(state.lastPlacedOrder);
  });

  // ── Customer dashboard ──
  dom.customerDashboardClose?.addEventListener("click", closeCustomerDashboard);
  dom.customerDashboardModal?.addEventListener("click", (e) => {
    if (e.target === dom.customerDashboardModal) closeCustomerDashboard();
  });
  dom.customerLogoutBtn?.addEventListener("click", () => {
    state.currentUser = null;
    saveToStorage("cr_user", null);
    updateUserButton();
    closeCustomerDashboard();
    showToast("info", "Logged Out", "You have been securely logged out.");
  });

  // Dashboard order actions (delegated)
  dom.customerOrdersList.addEventListener("click", (e) => {
    const btn = e.target.closest(".order-action-btn");
    if (!btn) return;
    const id = btn.dataset.orderId;
    if (btn.dataset.orderAction === "edit") editOrder(id);
    else if (btn.dataset.orderAction === "save") saveReceiptFor(id);
    else if (btn.dataset.orderAction === "share") shareWhatsAppFor(id);
  });

  // ── User button ──
  dom.userBtn.addEventListener("click", () => {
    if (state.currentUser) openCustomerDashboard();
    else openCustomerLogin();
  });

  // ── Admin entry ──
  dom.adminToggle.addEventListener("click", () => {
    if (state.isAdmin) openAdminPanel();
    else openAdminLogin();
  });

  dom.adminLoginClose.addEventListener("click", closeAdminLogin);
  dom.adminLoginModal.addEventListener("click", (e) => {
    if (e.target === dom.adminLoginModal) closeAdminLogin();
  });
  dom.adminUsername.addEventListener("input", validateAdminForm);
  dom.adminPassword.addEventListener("input", validateAdminForm);
  dom.adminLoginBtn.addEventListener("click", attemptAdminLogin);
  dom.adminPassword.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !dom.adminLoginBtn.disabled) attemptAdminLogin();
  });

  // ── Admin panel ──
  dom.closeAdminBtn.addEventListener("click", closeAdminPanel);
  dom.adminTabBtns.forEach((btn) => btn.addEventListener("click", () => switchAdminTab(btn.dataset.tab)));

  dom.adminProductSearch.addEventListener(
    "input",
    debounce(() => {
      state.adminSearch = dom.adminProductSearch.value;
      renderAdminProducts();
    }, 200)
  );
  dom.adminCategoryFilterEl.addEventListener("change", () => {
    state.adminCategoryFilter = dom.adminCategoryFilterEl.value;
    renderAdminProducts();
  });
  dom.adminLabelFilterEl.addEventListener("change", () => {
    state.adminLabelFilter = dom.adminLabelFilterEl.value;
    renderAdminProducts();
  });

  dom.adminProductsTbody.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".admin-action-btn.edit");
    const deleteBtn = e.target.closest(".admin-action-btn.delete");
    if (editBtn) editProduct(editBtn.dataset.editId);
    if (deleteBtn) deleteProduct(deleteBtn.dataset.deleteId);
  });

  // ── Admin form: custom category / labels ──
  dom.formCategory.addEventListener("change", (e) => {
    const custom = e.target.value === "Custom...";
    dom.formCustomCategory.style.display = custom ? "block" : "none";
    dom.formCustomCategory.required = custom;
  });

  dom.formLabelSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    if (!val) return;
    if (val === "Custom...") {
      dom.formCustomLabelWrap.style.display = "flex";
      dom.formLabelSelect.style.display = "none";
    } else if (!state.currentFormLabels.includes(val)) {
      state.currentFormLabels.push(val);
      renderFormLabels();
    }
    dom.formLabelSelect.value = "";
  });

  dom.formCancelCustomLabelBtn.addEventListener("click", () => {
    dom.formCustomLabelWrap.style.display = "none";
    dom.formLabelSelect.style.display = "block";
    dom.formCustomLabel.value = "";
  });

  dom.formAddLabelBtn.addEventListener("click", () => {
    const val = dom.formCustomLabel.value.trim();
    if (!val) return;
    if (!state.dynamicLabels.includes(val)) {
      state.dynamicLabels.push(val);
      saveToStorage("cr_labels", state.dynamicLabels);
    }
    if (!state.currentFormLabels.includes(val)) {
      state.currentFormLabels.push(val);
      renderFormLabels();
    }
    dom.formCustomLabelWrap.style.display = "none";
    dom.formLabelSelect.style.display = "block";
    dom.formCustomLabel.value = "";
  });

  // Remove a selected label chip (delegated)
  dom.formSelectedLabelsContainer.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-remove-label]");
    if (chip) removeFormLabel(chip.dataset.removeLabel);
  });

  dom.formImageInput.addEventListener("change", (e) => handleImageUpload(e.target.files[0]));
  dom.adminProductForm.addEventListener("submit", saveProduct);
  dom.formCancelBtn.addEventListener("click", () => {
    resetAdminForm();
    switchAdminTab("products");
  });

  // ── Admin bulk upload ──
  const adminBulkUploadBtn = document.getElementById("admin-bulk-upload-btn");
  const adminBulkSampleBtn = document.getElementById("admin-bulk-sample-btn");
  const adminBulkUploadInput = document.getElementById("admin-bulk-upload-input");
  const adminSeedBtn = document.getElementById("admin-seed-supabase-btn");

  adminBulkSampleBtn?.addEventListener("click", downloadSampleCSV);
  if (adminBulkUploadBtn && adminBulkUploadInput) {
    adminBulkUploadBtn.addEventListener("click", () => adminBulkUploadInput.click());
    adminBulkUploadInput.addEventListener("change", (e) => {
      handleBulkUpload(e.target.files[0]);
      adminBulkUploadInput.value = "";
    });
  }
  adminSeedBtn?.addEventListener("click", seedSupabase);

  // ── Global keyboard ──
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (dom.imageZoomModal.classList.contains("open")) {
      dom.imageZoomModal.classList.remove("open");
      document.body.style.overflow = "";
    } else if (dom.customerModal.classList.contains("open")) closeCustomerLogin();
    else if (dom.adminLoginModal.classList.contains("open")) closeAdminLogin();
    else if (dom.adminPanel.classList.contains("open")) closeAdminPanel();
    else if (dom.cartPanel.classList.contains("open")) closeCart();
  });
}

init();
