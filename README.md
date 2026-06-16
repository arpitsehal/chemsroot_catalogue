# Chems Root Pharmaceutical — B2B Product Catalog

A professional, feature-rich B2B pharmaceutical product catalog and order management system designed for pharmaceutical distributors and PCD franchises.

![Chems Root Logo](assets/logo.jpg)

## 🌟 Key Features

### 🛒 Catalog & Ordering
- **Dynamic Product Grid**: Clean, professional layout with high-quality product cards.
- **Unit-Based Ordering**: Designed specifically for wholesale—tracks box counts and units instead of retail pricing.
- **Instant Quantity Update**: Adjust quantities directly from the catalog page without opening the cart.
- **Image Zoom**: Click on any product image to see a high-resolution zoomed-in view.
- **Search & Filter**: Powerful search bar combined with category and medical specialty (label) filters.

### 📄 Professional Invoicing
- **Auto-Generated Invoices**: Creates professional, branded PDF-style receipts upon order completion.
- **Visual Receipts**: Uses `html2canvas` to generate shareable `.jpg` images of invoices directly in the browser.
- **WhatsApp Integration**: Share order summaries and invoice details directly to customers via WhatsApp.

### 👤 Customer Dashboard
- **Order History**: Customers can view all their previous orders in a dedicated dashboard.
- **Re-Order / Edit**: Click "Edit" on a past order to instantly reload those items into the cart for quick modification or re-ordering.
- **Secure Phone Login**: Simple, frictionless login using name and mobile number.

### 🛠️ Admin Dashboard
- **Product Management**: Full CRUD (Create, Read, Update, Delete) operations for the entire catalog.
- **Bulk Upload**: Import hundreds of products instantly using CSV bulk upload.
- **Category & Label Management**: Create custom categories and medical specialties on the fly.
- **Order Management**: Track and view all incoming orders from customers.

## 🛠️ Technology Stack
- **Frontend**: HTML5, Vanilla CSS3 (clean light-pharma design system), Modern JavaScript (ES Modules).
- **Architecture**: `app.js` was refactored from a single 1,700-line file into focused ES modules under `js/`.
- **Libraries**: `html2canvas` and `@supabase/supabase-js` are **lazy-loaded on demand** (dynamic `import` from a CDN) so they never block first paint.
- **Storage**: `localStorage` (offline-first), with optional Supabase sync that runs in the background after the page has already rendered.
- **Design**: Responsive, accessible light UI with smooth transitions and micro-animations.

### 📁 Project Structure
```
index.html          Markup + module entry point
index.css           Light-pharma design system
js/
  main.js           Entry point: bootstraps render + wires events
  store.js          Central state + localStorage persistence
  dom.js            Cached DOM references
  data.js           Seed products, categories, labels, constants
  catalog.js        Product grid, filters, search
  cart.js           Cart state + cart panel
  customer.js       Login, checkout, receipts, dashboard
  admin.js          Admin login, product CRUD, orders, bulk CSV
  exports.js        Printable product / image catalogues
  supabase.js       Lazy Supabase sync layer
  utils.js          Toasts, dates, search highlighting
```

## 🚀 Getting Started

### Installation
The app now uses **ES Modules**, which browsers only load over `http(s)://` — not by double-clicking the file (`file://`). Serve the folder with any static server:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/chems-root-catalog.git
   cd chems-root-catalog
   ```
2. Start a local server (pick one):
   ```bash
   npx serve .          # Node
   python -m http.server # Python 3
   ```
   …or use the VS Code **Live Server** extension. Then open the printed URL (e.g. `http://localhost:3000`).

### Deployment
The application is ready for instant deployment to static hosting platforms:
- **Netlify**: Drag and drop the folder to Netlify Drop.
- **GitHub Pages**: Push the code to a repository and enable Pages in settings.
- **Vercel**: Link your GitHub repository for automatic deployments.

## 🔒 Security Note
This version currently uses `localStorage` for data persistence. This means data is saved locally on the user's browser. For a multi-user, synchronized production environment, it is recommended to connect this frontend to a cloud database like **Firebase** or **Supabase**.

---

© 2026 Chems Root Pharmaceutical. All rights reserved.
