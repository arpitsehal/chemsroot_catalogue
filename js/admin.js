/* Admin: login, panel, product CRUD, orders, bulk CSV upload. */
import { state, saveToStorage } from "./store.js";
import { dom } from "./dom.js";
import { LABEL_COLORS, CATEGORY_IMAGES, ADMIN_CREDENTIALS } from "./data.js";
import { showToast, formatDate } from "./utils.js";
import { renderProducts, renderLabelPills, renderFilterPills } from "./catalog.js";
import { updateCartUI } from "./cart.js";
import { useRemote, deleteProductRemote, upsertProductsRemote } from "./supabase.js";

// ── Selected-label chips on the add/edit form ──────────────
export function renderFormLabels() {
  dom.formSelectedLabelsContainer.innerHTML = state.currentFormLabels
    .map((l) => {
      const c = LABEL_COLORS[l] || LABEL_COLORS.General;
      return `<span class="form-label-chip" style="background:${c.bg};color:${c.text};border-color:${c.border};">
        ${l} <span class="chip-remove" data-remove-label="${l}">✕</span>
      </span>`;
    })
    .join("");
  populateAdminFilters();
}

export function removeFormLabel(lbl) {
  state.currentFormLabels = state.currentFormLabels.filter((l) => l !== lbl);
  renderFormLabels();
}

// ── Login ──────────────────────────────────────────────────
export function openAdminLogin() {
  dom.adminLoginModal.classList.add("open");
  document.body.style.overflow = "hidden";
  dom.adminLoginError.textContent = "";
  dom.adminUsername.value = "";
  dom.adminPassword.value = "";
  dom.adminLoginBtn.disabled = true;
}

export function closeAdminLogin() {
  dom.adminLoginModal.classList.remove("open");
  document.body.style.overflow = "";
}

export function validateAdminForm() {
  dom.adminLoginBtn.disabled = !dom.adminUsername.value.trim() || !dom.adminPassword.value.trim();
}

export function attemptAdminLogin() {
  const user = dom.adminUsername.value.trim();
  const pass = dom.adminPassword.value.trim();
  if (user === ADMIN_CREDENTIALS.username && pass === ADMIN_CREDENTIALS.password) {
    state.isAdmin = true;
    closeAdminLogin();
    openAdminPanel();
    showToast("success", "Admin Login", "Welcome to the dashboard");
  } else {
    dom.adminLoginError.textContent = "❌ Invalid username or password";
    dom.adminPassword.value = "";
    dom.adminLoginBtn.disabled = true;
  }
}

// ── Panel ──────────────────────────────────────────────────
export function openAdminPanel() {
  dom.adminPanel.classList.add("open");
  document.body.style.overflow = "hidden";
  switchAdminTab("products");
  renderAdminProducts();
  renderAdminOrders();
}

export function closeAdminPanel() {
  dom.adminPanel.classList.remove("open");
  document.body.style.overflow = "";
}

export function switchAdminTab(tab, skipReset) {
  dom.adminTabBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
  dom.adminProductsTab.classList.toggle("active", tab === "products");
  dom.adminOrdersTab.classList.toggle("active", tab === "orders");
  dom.adminAddTab.classList.toggle("active", tab === "add");

  if (tab === "add" && !skipReset) resetAdminForm();
  if (tab === "products") renderAdminProducts();
  if (tab === "orders") renderAdminOrders();
}

// ── Filters / selects ──────────────────────────────────────
export function populateAdminFilters() {
  dom.adminCategoryFilterEl.innerHTML =
    '<option value="All">All Categories</option>' +
    state.dynamicCategories.filter((c) => c !== "All").map((c) => `<option value="${c}">${c}</option>`).join("");

  dom.adminLabelFilterEl.innerHTML =
    '<option value="All">All Labels</option>' +
    state.dynamicLabels.filter((l) => l !== "All").map((l) => `<option value="${l}">${l}</option>`).join("");

  if (dom.formCategory) {
    dom.formCategory.innerHTML =
      '<option value="">Select Category</option>' +
      state.dynamicCategories.filter((c) => c !== "All").map((c) => `<option value="${c}">${c}</option>`).join("") +
      '<option value="Custom...">Custom...</option>';
  }

  if (dom.formLabelSelect) {
    dom.formLabelSelect.innerHTML =
      '<option value="">Select Label to Add...</option>' +
      state.dynamicLabels
        .filter((l) => l !== "All" && !state.currentFormLabels.includes(l))
        .map((l) => `<option value="${l}">${l}</option>`)
        .join("") +
      '<option value="Custom...">Custom Label...</option>';
  }
}

// ── Products table ─────────────────────────────────────────
export function renderAdminProducts() {
  let list = state.products;
  if (state.adminCategoryFilter !== "All") list = list.filter((p) => p.category === state.adminCategoryFilter);
  if (state.adminLabelFilter !== "All") list = list.filter((p) => p.labels && p.labels.includes(state.adminLabelFilter));
  if (state.adminSearch.trim()) {
    const q = state.adminSearch.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.composition.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    );
  }

  if (list.length === 0) {
    dom.adminProductsTbody.innerHTML = `<tr><td colspan="8" class="table-empty">No products found</td></tr>`;
    return;
  }

  dom.adminProductsTbody.innerHTML = list
    .map(
      (p) => `
      <tr>
        <td><code class="cell-id">${p.id}</code></td>
        <td class="product-name-cell">${p.name}</td>
        <td class="composition-cell">${p.composition}</td>
        <td>${p.category}</td>
        <td>
          <div class="label-cell-wrap">
            ${(p.labels || ["General"])
              .map((lbl) => {
                const c = LABEL_COLORS[lbl] || LABEL_COLORS.General;
                return `<span class="label-cell-tag" style="background:${c.bg};color:${c.text};border-color:${c.border};">${lbl}</span>`;
              })
              .join("")}
          </div>
        </td>
        <td class="price-cell">₹${p.price.toFixed(2)}</td>
        <td class="rate-cell">${p.rate != null && p.rate !== "" && !isNaN(p.rate) ? "₹" + Number(p.rate).toFixed(2) : "<span class=\"rate-empty\">NA</span>"}</td>
        <td>
          <div class="admin-actions-cell">
            <button class="admin-action-btn edit" data-edit-id="${p.id}">✏️ Edit</button>
            <button class="admin-action-btn delete" data-delete-id="${p.id}">🗑️ Delete</button>
          </div>
        </td>
      </tr>`
    )
    .join("");
}

// ── Orders ─────────────────────────────────────────────────
export function renderAdminOrders() {
  if (state.orders.length === 0) {
    dom.adminOrdersContent.innerHTML = `
      <div class="admin-empty">
        <div class="empty-icon">📋</div>
        <p>No orders yet</p>
        <p class="empty-hint">Orders placed by customers will appear here.</p>
      </div>`;
    return;
  }

  const sorted = [...state.orders].reverse();
  dom.adminOrdersContent.innerHTML = sorted
    .map(
      (order) => `
      <div class="admin-order">
        <div class="admin-order-header">
          <span class="admin-order-id">${order.orderId}</span>
          <span class="admin-order-date">${formatDate(order.placedAt)}</span>
        </div>
        <div class="admin-order-customer">
          <strong>${order.customer.name}</strong> · 📱 ${order.customer.phone}
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
      </div>`
    )
    .join("");
}

// ── Add / edit form ────────────────────────────────────────
export function resetAdminForm() {
  dom.formEditId.value = "";
  dom.formProductId.value = "";
  dom.formProductName.value = "";
  dom.formComposition.value = "";
  dom.formDescription.value = "";
  dom.formCategory.value = "";
  if (dom.formLabelSelect) dom.formLabelSelect.value = "";
  dom.formPrice.value = "";
  if (dom.formRate) dom.formRate.value = "";
  dom.formPackaging.value = "";
  dom.formBadge.value = "";
  dom.formImageInput.value = "";
  dom.formImagePreview.style.display = "none";
  dom.formImagePreview.src = "";
  state.uploadedImageDataUrl = null;
  dom.formCustomCategory.value = "";
  dom.formCustomCategory.style.display = "none";
  dom.formCustomCategory.required = false;
  dom.formCustomLabel.value = "";
  dom.formCustomLabelWrap.style.display = "none";
  dom.formLabelSelect.style.display = "block";
  state.currentFormLabels = [];
  renderFormLabels();
  dom.formTitle.textContent = "Add New Product";
  dom.formSubmitBtn.textContent = "Add Product";
  dom.formProductId.disabled = false;
}

export function editProduct(productId) {
  const p = state.products.find((pr) => pr.id === productId);
  if (!p) return;

  switchAdminTab("add", true);
  resetAdminForm();

  dom.formEditId.value = p.id;
  dom.formProductId.value = p.id;
  dom.formProductId.disabled = true;
  dom.formProductName.value = p.name;
  dom.formComposition.value = p.composition;
  dom.formDescription.value = p.description;

  state.currentFormLabels = p.labels ? [...p.labels] : ["General"];
  renderFormLabels();

  dom.formCategory.value = p.category;
  dom.formPrice.value = p.price;
  if (dom.formRate) dom.formRate.value = p.rate != null ? p.rate : "";
  dom.formPackaging.value = p.packaging;
  dom.formBadge.value = p.badge || "";

  if (p.image && !p.image.startsWith("assets/")) {
    state.uploadedImageDataUrl = p.image;
    dom.formImagePreview.src = p.image;
    dom.formImagePreview.style.display = "block";
  } else {
    state.uploadedImageDataUrl = null;
    dom.formImagePreview.style.display = "none";
    dom.formImagePreview.src = "";
  }
  dom.formTitle.textContent = `Edit Product — ${p.id}`;
  dom.formSubmitBtn.textContent = "Save Changes";
}

// ── Delete ─────────────────────────────────────────────────
export function deleteProduct(productId) {
  const p = state.products.find((pr) => pr.id === productId);
  if (!p) return;
  state.pendingDeleteId = productId;
  showDeleteModal(p.name, p.id);
}

function showDeleteModal(name, id) {
  let modal = document.getElementById("delete-confirm-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "delete-confirm-modal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal delete-modal">
        <div class="delete-modal-icon">🗑️</div>
        <h3 id="delete-modal-title">Delete Product?</h3>
        <p class="delete-modal-msg" id="delete-modal-msg"></p>
        <div class="delete-modal-actions">
          <button class="modal-btn btn-danger" id="delete-confirm-yes">Delete</button>
          <button class="modal-btn secondary" id="delete-confirm-no">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    document.getElementById("delete-confirm-yes").addEventListener("click", () => {
      if (state.pendingDeleteId) confirmDelete(state.pendingDeleteId);
      closeDeleteModal();
    });
    document.getElementById("delete-confirm-no").addEventListener("click", closeDeleteModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeDeleteModal();
    });
  }
  document.getElementById("delete-modal-msg").textContent = `"${name}" (${id}) — This action cannot be undone.`;
  modal.classList.add("open");
}

function closeDeleteModal() {
  const modal = document.getElementById("delete-confirm-modal");
  if (modal) modal.classList.remove("open");
  state.pendingDeleteId = null;
}

async function confirmDelete(productId) {
  const p = state.products.find((pr) => pr.id === productId);
  if (!p) return;

  if (useRemote) {
    const { error } = await deleteProductRemote(productId);
    if (error) {
      showToast("error", "Database Error", "Could not delete product.");
      return;
    }
  }

  state.products = state.products.filter((pr) => pr.id !== productId);
  saveToStorage("cr_products", state.products);

  state.cart = state.cart.filter((item) => item.id !== productId);
  saveToStorage("cr_cart", state.cart);

  renderProducts();
  updateCartUI();
  renderAdminProducts();
  showToast("info", "Product Deleted", p.name);
}

// ── Save (add / update) ────────────────────────────────────
export async function saveProduct(e) {
  e.preventDefault();

  const id = dom.formProductId.value.trim();
  const name = dom.formProductName.value.trim();
  const composition = dom.formComposition.value.trim();
  const description = dom.formDescription.value.trim();
  let category = dom.formCategory.value;

  if (category === "Custom...") {
    category = dom.formCustomCategory.value.trim();
    if (category && !state.dynamicCategories.includes(category)) {
      state.dynamicCategories.push(category);
      saveToStorage("cr_categories", state.dynamicCategories);
    }
  }

  const labels = [...state.currentFormLabels];
  const price = parseFloat(dom.formPrice.value);
  const rateRaw = dom.formRate ? dom.formRate.value.trim() : "";
  const rate = rateRaw === "" ? null : parseFloat(rateRaw);
  const packaging = dom.formPackaging.value.trim();
  const badge = dom.formBadge.value;
  const editId = dom.formEditId.value;

  const fallbackImage = CATEGORY_IMAGES[category] || "assets/pharma_tablets.png";
  let image = fallbackImage;

  if (editId) {
    const idx = state.products.findIndex((p) => p.id === editId);
    if (idx !== -1 && state.products[idx].image && !state.products[idx].image.startsWith("assets/")) {
      image = state.uploadedImageDataUrl || state.products[idx].image;
    } else {
      image = state.uploadedImageDataUrl || fallbackImage;
    }
  } else {
    image = state.uploadedImageDataUrl || fallbackImage;
  }

  if (!id || !name || !composition || !description || !category || labels.length === 0 || isNaN(price) || !packaging) {
    showToast("warning", "Missing Fields", "Please fill in all required fields and add at least one label.");
    return;
  }

  if (editId) {
    const idx = state.products.findIndex((p) => p.id === editId);
    if (idx !== -1) {
      state.products[idx] = { ...state.products[idx], name, composition, description, category, labels, price, rate, packaging, badge, image };
      showToast("success", "Product Updated", name);
    }
  } else {
    if (state.products.some((p) => p.id === id)) {
      showToast("error", "Duplicate ID", `Product ID "${id}" already exists`);
      return;
    }
    state.products.push({ id, name, composition, description, category, labels, price, rate, packaging, badge, image });
    showToast("success", "Product Added", name);
  }

  saveToStorage("cr_products", state.products);

  if (useRemote) {
    const { error } = await upsertProductsRemote([{ id, name, composition, description, category, labels, price, rate, packaging, badge, image }]);
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

// ── Image upload (client-side resize) ──────────────────────
export function handleImageUpload(file) {
  if (!file) {
    state.uploadedImageDataUrl = null;
    dom.formImagePreview.style.display = "none";
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 400;
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      state.uploadedImageDataUrl = canvas.toDataURL("image/jpeg", 0.7);
      dom.formImagePreview.src = state.uploadedImageDataUrl;
      dom.formImagePreview.style.display = "block";
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// ── Bulk CSV ───────────────────────────────────────────────
export function downloadSampleCSV() {
  const header = "ID,Name,Composition,Description,Price,Category,Labels,Packaging,Badge\n";
  const r1 = "CR-TAB-101,New Paracetamol 500mg,Paracetamol IP 500mg,Effective relief from fever.,35.00,Tablets,General,Strip of 10 tablets,New\n";
  const r2 = "CR-SYR-102,Cough Syrup,Dextromethorphan,Relief from cough.,75.00,Syrups,General;Pediatric,100ml bottle,\n";
  const blob = new Blob([header + r1 + r2], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample_products.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i++;
    } else if (char === '"') inQuotes = !inQuotes;
    else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else current += char;
  }
  result.push(current);
  return result.map((s) => s.trim());
}

export function handleBulkUpload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const lines = event.target.result.split("\n");
      if (lines.length < 2) throw new Error("File is empty or missing data rows.");

      let added = 0,
        updated = 0;
      const newProducts = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseCSVLine(line);
        if (cols.length < 8) continue;

        const id = cols[0],
          name = cols[1],
          composition = cols[2],
          description = cols[3];
        const price = parseFloat(cols[4]),
          category = cols[5],
          labelsRaw = cols[6];
        const packaging = cols[7],
          badge = cols[8] || "";
        if (!id || !name) continue;

        const labelsArray = labelsRaw ? labelsRaw.split(";").map((l) => l.trim()).filter(Boolean) : ["General"];
        const image = CATEGORY_IMAGES[category] || "assets/pharma_tablets.png";

        newProducts.push({ id, name, composition, description, price: isNaN(price) ? 0 : price, category, labels: labelsArray, image, packaging, badge });
        if (category && !state.dynamicCategories.includes(category)) state.dynamicCategories.push(category);
        labelsArray.forEach((l) => {
          if (!state.dynamicLabels.includes(l)) state.dynamicLabels.push(l);
        });
      }

      if (newProducts.length === 0) throw new Error("No valid products found.");

      newProducts.forEach((newP) => {
        const idx = state.products.findIndex((p) => p.id === newP.id);
        if (idx >= 0) {
          if (state.products[idx].image && !state.products[idx].image.startsWith("assets/")) newP.image = state.products[idx].image;
          state.products[idx] = newP;
          updated++;
        } else {
          state.products.push(newP);
          added++;
        }
      });

      saveToStorage("cr_products", state.products);
      saveToStorage("cr_categories", state.dynamicCategories);
      saveToStorage("cr_labels", state.dynamicLabels);

      if (useRemote) {
        showToast("info", "Syncing", "Syncing with database...");
        const { error } = await upsertProductsRemote(newProducts);
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
    } catch (err) {
      showToast("error", "Upload Failed", err.message);
    }
  };
  reader.readAsText(file);
}
