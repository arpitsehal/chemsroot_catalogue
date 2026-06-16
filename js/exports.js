/* Printable product catalogue + image catalogue (window.print). */
import { state } from "./store.js";
import { dom } from "./dom.js";
import { showToast } from "./utils.js";

function generateCatalogueHTML(productList) {
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const sorted = [...productList].sort((a, b) =>
    (a.composition || "").toLowerCase().localeCompare((b.composition || "").toLowerCase())
  );

  const grouped = {};
  sorted.forEach((p) => {
    const cat = p.category || "Other";
    (grouped[cat] ||= []).push(p);
  });

  const targetOrder = ["Tablets", "Capsules", "Syrups"];
  const entries = Object.entries(grouped).sort((a, b) => {
    const idxA = targetOrder.indexOf(a[0]);
    const idxB = targetOrder.indexOf(b[0]);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a[0].localeCompare(b[0]);
  });

  let serialNo = 0;
  let tableRows = "";
  entries.forEach(([category, items]) => {
    tableRows += `
      <tr class="cat-heading-row">
        <td colspan="7" class="cat-heading-cell">📦 ${category.toUpperCase()}</td>
      </tr>`;
    items.forEach((p) => {
      serialNo++;
      const formattedComp = p.composition.split(",").map((s) => s.trim()).join("<br>");
      tableRows += `
        <tr>
          <td>${serialNo}</td>
          <td class="prod-name">${p.name.toUpperCase()}</td>
          <td class="prod-comp">${formattedComp}</td>
          <td>${p.category}</td>
          <td>${(p.labels || []).join(", ")}</td>
          <td>${p.packaging}</td>
          <td class="prod-price col-price">${p.price.toFixed(2)}</td>
        </tr>`;
    });
  });

  return `
    <div class="catalogue-wrapper">
      <div class="catalogue-header">
        <div class="catalogue-header-left">
          <img src="assets/logo.jpg" alt="Chems Root Logo" />
          <div class="catalogue-title">
            <h1>Chems Root Pharmaceutical</h1>
            <p>Product Catalogue &amp; Price List</p>
          </div>
        </div>
        <div class="catalogue-meta">
          <div><strong>Date:</strong> ${today}</div>
          <div><strong>Total Products:</strong> ${productList.length}</div>
        </div>
      </div>

      <table class="catalogue-table">
        <thead>
          <tr>
            <th class="w-sno">S.NO</th>
            <th class="w-name">PRODUCT NAME</th>
            <th>COMPOSITION</th>
            <th class="w-cat">CATEGORY</th>
            <th class="w-spec">SPECIALTY</th>
            <th class="w-pack">PACKAGING</th>
            <th class="w-price col-price">MRP (₹)</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>

      <div class="catalogue-footer">
        <p>© 2026 Chems Root Pharmaceutical. Quality healthcare products trusted by professionals.</p>
        <p class="footer-fine">This is a computer-generated document.</p>
      </div>
    </div>`;
}

export function downloadCatalogue() {
  if (!dom.printableCatalogue) return;
  showToast("info", "Preparing Catalogue", "Generating your product list...");
  dom.printableCatalogue.innerHTML = generateCatalogueHTML(state.products);
  setTimeout(() => {
    window.print();
    showToast("success", "Success", "Catalogue ready for download.");
  }, 500);
}

function generateImageCatalogueHTML(productList) {
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const sortedList = [...productList].sort((a, b) =>
    (a.composition || "").localeCompare(b.composition || "")
  );

  const gridHTML = sortedList
    .map(
      (p) => `
      <div class="image-catalogue-item">
        <img src="${p.image}" alt="${p.composition}" />
        <div class="prod-name">${p.composition.toUpperCase()}</div>
        <div class="prod-price">MRP ₹${p.price.toFixed(2)}</div>
      </div>`
    )
    .join("");

  return `
    <div class="catalogue-wrapper">
      <div class="catalogue-header">
        <div class="catalogue-header-left">
          <img src="assets/logo.jpg" alt="Chems Root Logo" />
          <div class="catalogue-title">
            <h1>Chems Root Pharmaceutical</h1>
            <p>Image Catalogue &amp; Price List</p>
          </div>
        </div>
        <div class="catalogue-meta">
          <div><strong>Date:</strong> ${today}</div>
          <div><strong>Total Products:</strong> ${sortedList.length}</div>
        </div>
      </div>
      <div class="image-catalogue-grid">${gridHTML}</div>
      <div class="catalogue-footer">
        <p>© 2026 Chems Root Pharmaceutical. Quality healthcare products trusted by professionals.</p>
        <p class="footer-fine">This is a computer-generated document.</p>
      </div>
    </div>`;
}

export function downloadImageCatalogue() {
  if (!dom.printableCatalogue) return;
  showToast("info", "Preparing Image Catalogue", "Generating your image catalogue...");
  dom.printableCatalogue.innerHTML = generateImageCatalogueHTML(state.products);
  setTimeout(() => {
    window.print();
    showToast("success", "Success", "Image Catalogue ready for download.");
  }, 1500);
}
