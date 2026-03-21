// src/api/endpoints.ts

export const ENDPOINTS = {

  // ── Auth ─────────────────────────────────────────────────────────
  auth: {
    login:   "/token/",
    refresh: "/token/refresh/",
  },

  // ── Users ────────────────────────────────────────────────────────
  users: {
    list:          "/users/",
    create:        "/users/",
    me:            "/users/me/",
    employees:     "/users/employees/",
    managers:      "/users/managers/",
    changePassword:"/users/change_password/",
    updateProfile: "/users/update_profile/",
    detail:        (id: number) => `/users/${id}/`,
    toggleActive:  (id: number) => `/users/${id}/toggle_active/`,
  },

  // ── Categories ───────────────────────────────────────────────────
  categories: {
    list:     "/categories/",
    create:   "/categories/",
    detail:   (id: number) => `/categories/${id}/`,
    products: (id: number) => `/categories/${id}/products/`,
  },

  // ── Products ─────────────────────────────────────────────────────
  products: {
    list:             "/products/",
    create:           "/products/",
    statistics:       "/products/statistics/",
    lowStock:         "/products/low_stock/",
    needsReorder:     "/products/needs_reorder/",
    outOfStock:       "/products/out_of_stock/",
    bulkUpdatePrices: "/products/bulk_update_prices/",
    detail:           (id: number) => `/products/${id}/`,
    stockByShop:      (id: number) => `/products/${id}/stock_by_shop/`,
    toggleActive:     (id: number) => `/products/${id}/toggle_active/`,
  },

  // ── Shops ────────────────────────────────────────────────────────
  shops: {
    list:          "/shops/",
    create:        "/shops/",
    statistics:    "/shops/statistics/",
    detail:        (id: number) => `/shops/${id}/`,
    employees:     (id: number) => `/shops/${id}/employees/`,
    staff:         (id: number) => `/shops/${id}/staff/`,
    assignManager: (id: number) => `/shops/${id}/assign_manager/`,
    toggleActive:  (id: number) => `/shops/${id}/toggle_active/`,
  },

  // ── Stocks ───────────────────────────────────────────────────────
  stocks: {
    list:   "/stocks/",
    create: "/stocks/",
    adjust: "/stocks/adjust/",
    alerts: "/stocks/alerts/",
    detail: (id: number) => `/stocks/${id}/`,
  },

  // ── Stock Movements ──────────────────────────────────────────────
  stockMovements: {
    list:        "/stock-movements/",
    addStock:    "/stock-movements/add_stock/",
    removeStock: "/stock-movements/remove_stock/",
    detail:      (id: number) => `/stock-movements/${id}/`,
  },

  // ── Stock Transfers ──────────────────────────────────────────────
  stockTransfers: {
    list:   "/stock-transfers/",
    create: "/stock-transfers/",
    detail: (id: number) => `/stock-transfers/${id}/`,
    send:   (id: number) => `/stock-transfers/${id}/send/`,
    receive:(id: number) => `/stock-transfers/${id}/receive/`,
    cancel: (id: number) => `/stock-transfers/${id}/cancel/`,
  },

  // ── Inventories ──────────────────────────────────────────────────
  inventories: {
    list:          "/inventories/",
    create:        "/inventories/",
    statistics:    "/inventories/statistics/",
    detail:        (id: number) => `/inventories/${id}/`,
    start:         (id: number) => `/inventories/${id}/start/`,
    complete:      (id: number) => `/inventories/${id}/complete/`,
    validate:      (id: number) => `/inventories/${id}/validate/`,
    cancel:        (id: number) => `/inventories/${id}/cancel/`,
    addProducts:   (id: number) => `/inventories/${id}/add_products/`,
    countProduct:  (id: number) => `/inventories/${id}/count_product/`,
    countMultiple: (id: number) => `/inventories/${id}/count_multiple/`,
    discrepancies: (id: number) => `/inventories/${id}/discrepancies/`,
  },


} as const;
