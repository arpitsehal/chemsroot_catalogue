/* Catalog rendering: filter pills, product grid, search filtering. */
import { state } from "./store.js";
import { dom } from "./dom.js";
import { LABEL_COLORS } from "./data.js";
import { highlightMatch, getBadgeHTML } from "./utils.js";
import { isInCart, cartQty } from "./cart.js";

export function renderLabelPills() {
  dom.labelPills.innerHTML = state.dynamicLabels
    .map((lbl) => {
      const isActive = lbl === state.currentLabel;
      const colors = LABEL_COLORS[lbl];
      let style = "";
      if (isActive && colors) {
        style = `background:${colors.text};color:#fff;border-color:${colors.text};`;
      } else if (colors) {
        style = `background:${colors.bg};color:${colors.text};border-color:${colors.border};`;
      }
      return `<button class="label-pill${isActive ? " active" : ""}" data-label="${lbl}" style="${style}">${lbl}</button>`;
    })
    .join("");
}

export function renderFilterPills() {
  dom.filterPills.innerHTML = state.dynamicCategories
    .map(
      (cat) =>
        `<button class="filter-pill${cat === state.currentCategory ? " active" : ""}" data-category="${cat}">${cat}</button>`
    )
    .join("");
}

export function getFilteredProducts() {
  let list = state.products;
  if (state.currentCategory !== "All") list = list.filter((p) => p.category === state.currentCategory);
  if (state.currentLabel !== "All") list = list.filter((p) => p.labels && p.labels.includes(state.currentLabel));
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.composition.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.labels && p.labels.some((l) => l.toLowerCase().includes(q)))
    );
  }
  // Float "New" badged products to the top so users see them first.
  // Array.sort is stable, so products keep their existing relative order otherwise.
  return list
    .slice()
    .sort((a, b) => (b.badge === "New" ? 1 : 0) - (a.badge === "New" ? 1 : 0));
}

function cardHTML(p) {
  const labelsToRender = p.labels && p.labels.length ? p.labels : ["General"];
  const labelTagsHTML = labelsToRender
    .map((lbl) => {
      const c = LABEL_COLORS[lbl] || LABEL_COLORS.General;
      return `<span class="card-label-tag" style="background:${c.bg};color:${c.text};border-color:${c.border};">${lbl}</span>`;
    })
    .join("");

  const inCart = isInCart(p.id);
  const qty = inCart ? cartQty(p.id) : 1;

  const hasVisualAid = !!p.visualAid;
  const imageAreaHTML = hasVisualAid
    ? `
        <div class="card-image-track">
          <div class="card-image-slide"><img src="${p.image}" alt="${p.name}" loading="lazy" decoding="async" /></div>
          <div class="card-image-slide"><img src="${p.visualAid}" alt="${p.name} — visual aid" loading="lazy" decoding="async" /></div>
        </div>
        <div class="card-image-dots">
          <span class="card-image-dot active" data-dot="0"></span>
          <span class="card-image-dot" data-dot="1"></span>
        </div>`
    : `<img src="${p.image}" alt="${p.name}" loading="lazy" decoding="async" />`;

  return `
    <div class="product-card" data-product-id="${p.id}">
      <div class="card-image${hasVisualAid ? " has-visual-aid" : ""}" data-slide="0">
        ${getBadgeHTML(p.badge)}
        <div class="card-label-stack">${labelTagsHTML}</div>
        ${imageAreaHTML}
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
            <input type="number" id="qty-${p.id}" class="qty-input" value="${qty}" min="1" />
            <button class="add-to-cart-btn ${inCart ? "added" : ""}" data-id="${p.id}">
              <span class="btn-icon">${inCart ? "↻" : "+"}</span>
              <span>${inCart ? "Update" : "Add"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

export function renderProducts() {
  const filtered = getFilteredProducts();

  dom.productsHeading.textContent =
    state.currentCategory === "All" && state.currentLabel === "All"
      ? "All Products"
      : state.currentLabel !== "All" && state.currentCategory !== "All"
      ? `${state.currentLabel} — ${state.currentCategory}`
      : state.currentLabel !== "All"
      ? state.currentLabel
      : state.currentCategory;

  dom.productCountEl.textContent = `${filtered.length} product${filtered.length !== 1 ? "s" : ""}`;

  if (filtered.length === 0) {
    dom.productGrid.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>No products found</p>
        <div class="no-results-hint">Try a different search, category, or specialty</div>
      </div>`;
    return;
  }

  dom.productGrid.innerHTML = filtered.map(cardHTML).join("");
}

/* Targeted update: refresh only one card's cart controls instead of
   re-rendering the whole grid (avoids destroying every <img>). */
export function updateCardCartState(id) {
  const card = dom.productGrid.querySelector(`.product-card[data-product-id="${id}"]`);
  if (!card) return;
  const inCart = isInCart(id);
  const btn = card.querySelector(".add-to-cart-btn");
  const input = card.querySelector(".qty-input");
  if (btn) {
    btn.classList.toggle("added", inCart);
    btn.innerHTML = `<span class="btn-icon">${inCart ? "↻" : "+"}</span><span>${inCart ? "Update" : "Add"}</span>`;
  }
  if (input) input.value = inCart ? cartQty(id) : 1;
}

/* Switches a swipeable product card between its main image (0) and
   visual aid (1) slide, updating the track position and dot state. */
export function setCardSlide(card, index) {
  const track = card.querySelector(".card-image-track");
  if (!track) return;
  card.dataset.slide = String(index);
  track.style.transform = `translateX(-${index * 50}%)`;
  card.querySelectorAll(".card-image-dot").forEach((dot, i) => dot.classList.toggle("active", i === index));
}

export function updateUserButton() {
  if (state.currentUser) {
    dom.userLabel.textContent = state.currentUser.name || state.currentUser.phone;
    dom.userBtn.classList.add("logged-in");
  } else {
    dom.userLabel.textContent = "Login";
    dom.userBtn.classList.remove("logged-in");
  }
}
