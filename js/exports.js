/* Printable product catalogue + image catalogue.
   Renders into a dedicated print window (reliable across browsers,
   no dependence on the page's @media print rules). */
import { state } from "./store.js";
import { showToast } from "./utils.js";

/* Self-contained styles for the print window. */
const PRINT_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111827; background: #fff; padding: 32px; }
  .catalogue-wrapper { max-width: 1000px; margin: 0 auto; }
  .catalogue-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #00A99D; padding-bottom: 20px; margin-bottom: 30px; }
  .catalogue-header-left { display: flex; align-items: center; gap: 20px; }
  .catalogue-header-left img { height: 70px; border-radius: 8px; }
  .catalogue-title h1 { font-size: 2rem; color: #008075; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
  .catalogue-title p { margin: 5px 0 0; color: #6b7280; font-weight: 600; font-size: 0.9rem; }
  .catalogue-meta { text-align: right; font-size: 0.85rem; color: #4b5563; }
  .catalogue-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 0.85rem; }
  .catalogue-table th { background: #00A99D; color: #fff; padding: 12px; text-align: left; font-weight: 700; text-transform: uppercase; border: 1px solid #008075; }
  .catalogue-table td { padding: 12px; border: 1px solid #e5e7eb; vertical-align: top; color: #374151; }
  .catalogue-table tr:nth-child(even) { background: #f9fafb; }
  .catalogue-table .prod-name { font-weight: 800; color: #111827; font-size: 1rem; line-height: 1.2; }
  .catalogue-table .prod-comp { font-style: italic; color: #4b5563; font-size: 0.8rem; line-height: 1.5; }
  .catalogue-table .prod-price { font-weight: 800; color: #008075; white-space: nowrap; }
  .catalogue-table .col-price { text-align: right; }
  .catalogue-table .cat-heading-row { break-inside: avoid; page-break-inside: avoid; }
  .catalogue-table .cat-heading-cell { background: #1a2940; color: #fff; font-size: 1rem; font-weight: 800; letter-spacing: 0.08em; padding: 12px 16px; border: 1px solid #0f1a2e; text-transform: uppercase; }
  .catalogue-table tr { page-break-inside: avoid; break-inside: avoid; }
  .catalogue-footer { margin-top: 24px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; color: #9CA3AF; font-size: 0.8rem; }
  .catalogue-footer .footer-fine { font-size: 0.7rem; margin-top: 5px; }
  .image-catalogue-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 20px; }
  .image-catalogue-item { border: 1px solid #e5e7eb; padding: 10px; border-radius: 8px; text-align: center; break-inside: avoid; page-break-inside: avoid; background: #fff; }
  .image-catalogue-item img { width: 100%; height: 120px; object-fit: contain; margin-bottom: 10px; }
  .image-catalogue-item .prod-name { font-size: 0.9rem; font-weight: 800; color: #111827; margin-bottom: 4px; min-height: 2.4em; }
  .image-catalogue-item .prod-price { font-size: 0.95rem; font-weight: 700; color: #00A99D; }

  /* Image catalogue — specialty grouped, 6 images per page */
  .img-cat-page { break-inside: avoid; page-break-inside: avoid; }
  .img-cat-page + .img-cat-page { break-before: page; page-break-before: always; }
  .img-cat-spec-heading { background: #1a2940; color: #fff; font-size: 1rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 10px 16px; border-radius: 6px; margin: 18px 0 14px; }
  .img-cat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .img-cat-item { border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; text-align: center; break-inside: avoid; page-break-inside: avoid; background: #fff; }
  .img-cat-item img { width: 100%; height: 160px; object-fit: contain; margin-bottom: 8px; }
  .img-cat-item .ic-name { font-size: 0.9rem; font-weight: 800; color: #111827; line-height: 1.3; }
  .img-cat-item .ic-sno { color: #008075; }
  .img-cat-item .ic-comp { font-size: 0.78rem; font-style: italic; color: #4b5563; line-height: 1.45; margin-top: 4px; }
  @page { margin: 1.5cm; size: A4; }
`;

/* Absolute logo URL so it resolves inside the new window too. */
function logoURL() {
  return new URL("assets/logo.jpg", window.location.href).href;
}

/* Open a print window with the given catalogue HTML and trigger print
   once it has loaded. window.open is called synchronously from the
   click handler so pop-up blockers allow it. */
function openPrintWindow(title, bodyHTML) {
  const win = window.open("", "_blank");
  if (!win) {
    showToast("error", "Pop-up Blocked", "Please allow pop-ups for this site to download the catalogue.");
    return;
  }
  win.document.open();
  win.document.write(
    `<!doctype html><html lang="en"><head><meta charset="utf-8" />` +
      `<title>${title}</title><style>${PRINT_CSS}</style></head>` +
      `<body>${bodyHTML}</body></html>`
  );
  win.document.close();
  win.focus();

  const triggerPrint = () => setTimeout(() => win.print(), 350);
  if (win.document.readyState === "complete") triggerPrint();
  else win.addEventListener("load", triggerPrint);
}

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
          <img src="${logoURL()}" alt="Chems Root Logo" />
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
  showToast("info", "Preparing Catalogue", "Opening your product list...");
  openPrintWindow("Chems Root — Product Catalogue", generateCatalogueHTML(state.products));
}

/* Preferred specialty display order; any specialty not listed here is
   appended afterwards in alphabetical order. */
const SPECIALTY_ORDER = [
  "General", "Gynecology", "Cardiac", "Neurology",
  "Orthopedic", "Dermatology", "Pediatric", "Gastroenterology",
];

/* Max images per printed A4 page (2 columns × 3 rows). */
const IMAGES_PER_PAGE = 6;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function generateImageCatalogueHTML(productList) {
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  /* Alphabetical by composition, then grouped by primary specialty.
     Grouping preserves the alphabetical order within each specialty. */
  const sortedList = [...productList].sort((a, b) =>
    (a.composition || "").toLowerCase().localeCompare((b.composition || "").toLowerCase())
  );

  const grouped = {};
  sortedList.forEach((p) => {
    const spec = (p.labels && p.labels[0]) ? p.labels[0] : "Other";
    (grouped[spec] ||= []).push(p);
  });

  const specialties = Object.keys(grouped).sort((a, b) => {
    const ia = SPECIALTY_ORDER.indexOf(a);
    const ib = SPECIALTY_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  /* Build pages: each specialty is split into chunks of IMAGES_PER_PAGE so
     no page ever shows more than 6 images. Continuation pages repeat the
     specialty heading marked "(continued)". */
  const pages = [];
  specialties.forEach((spec) => {
    chunk(grouped[spec], IMAGES_PER_PAGE).forEach((items, i) => {
      pages.push({ spec, continued: i > 0, items });
    });
  });

  let serialNo = 0;
  const pagesHTML = pages
    .map((pg) => {
      const itemsHTML = pg.items
        .map((p) => {
          serialNo++;
          const comp = (p.composition || "").split(",").map((s) => s.trim()).join(", ");
          return `
          <div class="img-cat-item">
            <img src="${new URL(p.image, window.location.href).href}" alt="${p.name}" />
            <div class="ic-name"><span class="ic-sno">${serialNo}.</span> ${p.name}</div>
            <div class="ic-comp">${comp}</div>
          </div>`;
        })
        .join("");
      return `
        <div class="img-cat-page">
          <div class="img-cat-spec-heading">${pg.spec}${pg.continued ? " (continued)" : ""}</div>
          <div class="img-cat-grid">${itemsHTML}</div>
        </div>`;
    })
    .join("");

  return `
    <div class="catalogue-wrapper">
      <div class="catalogue-header">
        <div class="catalogue-header-left">
          <img src="${logoURL()}" alt="Chems Root Logo" />
          <div class="catalogue-title">
            <h1>Chems Root Pharmaceutical</h1>
            <p>Image Catalogue</p>
          </div>
        </div>
        <div class="catalogue-meta">
          <div><strong>Date:</strong> ${today}</div>
          <div><strong>Total Products:</strong> ${sortedList.length}</div>
        </div>
      </div>
      ${pagesHTML}
      <div class="catalogue-footer">
        <p>© 2026 Chems Root Pharmaceutical. Quality healthcare products trusted by professionals.</p>
        <p class="footer-fine">This is a computer-generated document.</p>
      </div>
    </div>`;
}

export function downloadImageCatalogue() {
  showToast("info", "Preparing Image Catalogue", "Opening your image catalogue...");
  openPrintWindow("Chems Root — Image Catalogue", generateImageCatalogueHTML(state.products));
}
