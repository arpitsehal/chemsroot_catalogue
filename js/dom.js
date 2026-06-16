/*
 * Cached DOM references. Module scripts are deferred, so the DOM
 * is fully parsed before this executes.
 */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => root.querySelectorAll(sel);

export const dom = {
  // Catalog
  productGrid: $("#product-grid"),
  filterPills: $("#filter-pills"),
  labelPills: $("#label-pills"),
  searchInput: $("#search-input"),
  productsHeading: $("#products-heading"),
  productCountEl: $("#product-count"),

  // Header user button
  userBtn: $("#user-btn"),
  userLabel: $("#user-label"),

  // Cart
  cartToggle: $("#cart-toggle-btn"),
  cartOverlay: $("#cart-overlay"),
  cartPanel: $("#cart-panel"),
  closeCartBtn: $("#close-cart-btn"),
  cartItemsEl: $("#cart-items"),
  cartFooter: $("#cart-footer"),
  cartBadge: $("#cart-badge"),
  cartItemCount: $("#cart-item-count"),
  cartTotal: $("#cart-total"),
  checkoutBtn: $("#checkout-btn"),

  // Customer login modal
  customerModal: $("#customer-login-modal"),
  customerModalClose: $("#customer-modal-close"),
  phoneInput: $("#phone-input"),
  customerNameInput: $("#customer-name"),
  customerLoginBtn: $("#customer-login-btn"),
  continueShoppingBtn: $("#continue-shopping-btn"),
  orderConfirmation: $("#order-confirmation"),
  stepPhone: $("#customer-step-phone"),
  stepSuccess: $("#customer-step-success"),

  // Dashboard & success actions
  customerDashboardModal: $("#customer-dashboard-modal"),
  customerDashboardClose: $("#customer-dashboard-close"),
  dashboardUserInfo: $("#dashboard-user-info"),
  customerOrdersList: $("#customer-orders-list"),
  customerLogoutBtn: $("#customer-logout-btn"),
  btnSaveReceipt: $("#btn-save-receipt"),
  btnShareWa: $("#btn-share-wa"),

  // Admin login modal
  adminLoginModal: $("#admin-login-modal"),
  adminLoginClose: $("#admin-login-close"),
  adminUsername: $("#admin-username"),
  adminPassword: $("#admin-password"),
  adminLoginBtn: $("#admin-login-btn"),
  adminLoginError: $("#admin-login-error"),

  // Admin panel
  adminToggle: $("#admin-toggle-btn"),
  adminPanel: $("#admin-panel"),
  closeAdminBtn: $("#close-admin-btn"),

  // Admin tabs
  adminTabBtns: $$(".admin-tab-btn"),
  adminProductsTab: $("#admin-products-tab"),
  adminOrdersTab: $("#admin-orders-tab"),
  adminAddTab: $("#admin-add-tab"),
  adminOrdersContent: $("#admin-orders-content"),

  // Admin products table
  adminProductSearch: $("#admin-product-search"),
  adminCategoryFilterEl: $("#admin-category-filter"),
  adminLabelFilterEl: $("#admin-label-filter"),
  adminProductsTbody: $("#admin-products-tbody"),

  // Admin form
  adminProductForm: $("#admin-product-form"),
  formEditId: $("#form-edit-id"),
  formProductId: $("#form-product-id"),
  formProductName: $("#form-product-name"),
  formComposition: $("#form-composition"),
  formDescription: $("#form-description"),
  formCategory: $("#form-category"),
  formCustomCategory: $("#form-custom-category"),
  formLabelSelect: $("#form-label-select"),
  formCustomLabelWrap: $("#form-custom-label-wrap"),
  formCustomLabel: $("#form-custom-label"),
  formAddLabelBtn: $("#form-add-label-btn"),
  formCancelCustomLabelBtn: $("#form-cancel-custom-label-btn"),
  formSelectedLabelsContainer: $("#form-selected-labels-container"),
  formPrice: $("#form-price"),
  formPackaging: $("#form-packaging"),
  formBadge: $("#form-badge"),
  formImageInput: $("#form-image"),
  formImagePreview: $("#form-image-preview"),
  formTitle: $("#admin-form-title"),
  formSubmitBtn: $("#form-submit-btn"),
  formCancelBtn: $("#form-cancel-btn"),

  // Toast
  toastContainer: $("#toast-container"),

  // Catalogue export
  downloadCatalogueBtn: $("#download-catalogue-btn"),
  downloadImageCatalogueBtn: $("#download-image-catalogue-btn"),
  printableCatalogue: $("#printable-catalogue"),

  // Image zoom
  imageZoomModal: $("#image-zoom-modal"),
  imageZoomContent: $("#image-zoom-content"),
  imageZoomClose: $("#image-zoom-close"),
};
