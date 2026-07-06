// src/router/index.tsx
import { createBrowserRouter } from "react-router-dom";
import NotFoundPage from "../pages/NotFoundPage";
import { ProtectedRoute } from "./ProtectedRoute";
import MainLayout from "../components/layout/MainLayout";
import LoginPage           from "../pages/auth/LoginPage";
import ForgotPasswordPage  from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage   from "../pages/auth/ResetPasswordPage";
import RoleRedirect from "./RoleRedirect";
import AdminDashboard    from "../pages/admin/AdminDashboard";
import CreateShopPage    from "../pages/admin/CreateShopPage";
import CreateUserPage    from "../pages/admin/CreateUserPage";
import ShopListPage      from "../pages/admin/ShopListPage";
import UserListPage      from "../pages/admin/UserListPage";
import ManagerDashboard      from "../pages/manager/ManagerDashboard";
import ManagerUserListPage   from "../pages/manager/ManagerUserListPage";
import ProductListPage          from "../pages/shared/ProductListPage";
import CreateProductPage        from "../pages/shared/CreateProductPage";
import StockListPage            from "../pages/shared/StockListPage";
import StockMovementPage        from "../pages/shared/StockMovementPage";
import StockAdjustPage          from "../pages/shared/StockAdjustPage";
import StockMovementsPage       from "../pages/shared/StockMovementsPage";
import InventoryListPage        from "../pages/shared/InventoryListPage";
import CreateInventoryPage      from "../pages/shared/CreateInventoryPage";
import InventoryDetailPage      from "../pages/shared/InventoryDetailPage";
import InventoryDiscrepancyPage from "../pages/shared/InventoryDiscrepancyPage";
import TransferListPage         from "../pages/shared/TransferListPage";
import CreateTransferPage       from "../pages/shared/CreateTransferPage";
import EmployeeDashboard          from "../pages/employee/EmployeeDashboard";
import EmployeeProductListPage    from "../pages/employee/EmployeeProductListPage";
import EmployeeStockListPage      from "../pages/employee/EmployeeStockListPage";
import EmployeeInventoryListPage  from "../pages/employee/EmployeeInventoryListPage";
import EmployeeInventoryCountPage from "../pages/employee/EmployeeInventoryCountPage";
import EmployeeMovementsPage      from "../pages/employee/EmployeeMovementsPage";

import ShopAssignmentPage   from "../pages/manager/ShopAssignmentPage";
import CashierSessionPage   from "../pages/manager/CashierSessionPage";
import SalesHistoryPage        from "../pages/manager/SalesHistoryPage";
import LivreurListPage         from "../pages/manager/LivreurListPage";
import DeliveryManagementPage  from "../pages/shared/DeliveryManagementPage";
import CashierPOSPage       from "../pages/cashier/CashierPOSPage";
import DeliveryDriverPage   from "../pages/delivery/DeliveryDriverPage";
import DailyReportPage      from "../pages/shared/DailyReportPage";
import SalesListPage        from "../pages/shared/SalesListPage";

import WarehouseDashboard    from "../pages/warehouse/WarehouseDashboard";
import WarehouseStockPage    from "../pages/warehouse/WarehouseStockPage";
import WarehouseArrivagePage from "../pages/warehouse/WarehouseArrivagePage";
import WarehouseTransferPage from "../pages/warehouse/WarehouseTransferPage";


const A = (roles: string[], Page: React.ComponentType<any>, props?: any) => (
  <ProtectedRoute allowedRoles={roles as any}>
    <MainLayout><Page {...props} /></MainLayout>
  </ProtectedRoute>
);

const ADMIN       = ["SUPER_ADMIN"];
const MANAGER     = ["SHOP_MANAGER"];
const EMPLOYEE    = ["EMPLOYEE"];
const MAGASINIER  = ["MAGASINIER"];

export const router = createBrowserRouter([
  { path: "/login",           element: <LoginPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password",  element: <ResetPasswordPage /> },
  { path: "/",                element: <ProtectedRoute><RoleRedirect /></ProtectedRoute> },
  { path: "*",                element: <NotFoundPage /> },

  // ── Admin ─────────────────────────────────────────────────────────
  { path: "/admin",                                element: A(ADMIN, AdminDashboard)                        },
  { path: "/admin/shops",                          element: A(ADMIN, ShopListPage)                          },
  { path: "/admin/shops/create",                   element: A(ADMIN, CreateShopPage)                        },
  { path: "/admin/users",                          element: A(ADMIN, UserListPage)                          },
  { path: "/admin/users/create",                   element: A(ADMIN, CreateUserPage)                        },
  { path: "/admin/products",                       element: A(ADMIN, ProductListPage)                       },
  { path: "/admin/products/create",                element: A(ADMIN, CreateProductPage)                     },
  { path: "/admin/stocks",                         element: A(ADMIN, StockListPage)                         },
  { path: "/admin/stocks/add",                     element: A(ADMIN, StockMovementPage, { mode: "add" })    },
  { path: "/admin/stocks/remove",                  element: A(ADMIN, StockMovementPage, { mode: "remove" }) },
  { path: "/admin/stocks/adjust",                  element: A(ADMIN, StockAdjustPage)                       },
  { path: "/admin/movements",                      element: A(ADMIN, StockMovementsPage)                    },
  { path: "/admin/transfers",                      element: A(ADMIN, TransferListPage)                      },
  { path: "/admin/transfers/create",               element: A(ADMIN, CreateTransferPage)                    },
  { path: "/admin/inventories",                    element: A(ADMIN, InventoryListPage)                     },
  { path: "/admin/inventories/create",             element: A(ADMIN, CreateInventoryPage)                   },
  { path: "/admin/inventories/:id",                element: A(ADMIN, InventoryDetailPage)                   },
  { path: "/admin/inventories/:id/discrepancies",  element: A(ADMIN, InventoryDiscrepancyPage)               },
  { path: "/admin/rapport",      element: A(ADMIN, DailyReportPage)        },

  // ── Manager ───────────────────────────────────────────────────────
  { path: "/manager",                              element: A(MANAGER, ManagerDashboard)                        },
  { path: "/manager/users",                        element: A(MANAGER, ManagerUserListPage)                     },
  { path: "/manager/users/create",                 element: A(MANAGER, CreateUserPage)                          },
  { path: "/manager/affectations",                 element: A(MANAGER, ShopAssignmentPage)                      },
  { path: "/manager/products",                     element: A(MANAGER, ProductListPage)                         },
  { path: "/manager/products/create",              element: A(MANAGER, CreateProductPage)                       },
  { path: "/manager/stocks",                       element: A(MANAGER, StockListPage)                           },
  { path: "/manager/stocks/add",                   element: A(MANAGER, StockMovementPage, { mode: "add" })      },
  { path: "/manager/stocks/remove",                element: A(MANAGER, StockMovementPage, { mode: "remove" })   },
  { path: "/manager/stocks/adjust",                element: A(MANAGER, StockAdjustPage)                         },
  { path: "/manager/movements",                    element: A(MANAGER, StockMovementsPage)                      },
  { path: "/manager/transfers",                    element: A(MANAGER, TransferListPage)                        },
  { path: "/manager/transfers/create",             element: A(MANAGER, CreateTransferPage)                      },
  { path: "/manager/inventories",                  element: A(MANAGER, InventoryListPage)                       },
  { path: "/manager/inventories/create",           element: A(MANAGER, CreateInventoryPage)                     },
  { path: "/manager/inventories/:id",              element: A(MANAGER, InventoryDetailPage)                     },
  { path: "/manager/inventories/:id/discrepancies",element: A(MANAGER, InventoryDiscrepancyPage)                },
  { path: "/manager/sessions",   element: A(MANAGER, CashierSessionPage)  },
  { path: "/manager/caisse",     element: A(MANAGER, CashierPOSPage)       },
  { path: "/manager/rapport",    element: A(MANAGER, DailyReportPage)      },
  { path: "/manager/ventes",     element: A(MANAGER, SalesListPage)        },
  { path: "/manager/historique", element: A(MANAGER, SalesHistoryPage)     },
  { path: "/manager/livraisons", element: A(MANAGER, DeliveryManagementPage) },
  { path: "/manager/livreurs",  element: A(MANAGER, LivreurListPage)         },



  // ── Employee ──────────────────────────────────────────────────────
  { path: "/employee",                             element: A(EMPLOYEE, EmployeeDashboard)          },
  { path: "/employee/products",                    element: A(EMPLOYEE, EmployeeProductListPage)    },
  { path: "/employee/stocks",                      element: A(EMPLOYEE, EmployeeStockListPage)      },
  { path: "/employee/inventories",                 element: A(EMPLOYEE, EmployeeInventoryListPage)  },
  { path: "/employee/inventories/:id",             element: A(EMPLOYEE, EmployeeInventoryCountPage) },
  { path: "/employee/movements",                   element: A(EMPLOYEE, EmployeeMovementsPage)      },
  { path: "/employee/caisse",      element: A(EMPLOYEE, CashierPOSPage)           },
  { path: "/employee/livraisons", element: A(EMPLOYEE, DeliveryManagementPage)  },
  { path: "/employee/rapport",    element: A(EMPLOYEE, DailyReportPage)          },
  { path: "/employee/ventes",     element: A(EMPLOYEE, SalesListPage)            },



  { path: "/livreur",            element: A(["LIVREUR"], DeliveryDriverPage) },

  // ── Magasinier ────────────────────────────────────────────────────
  { path: "/magasinier",                  element: A(MAGASINIER, WarehouseDashboard)    },
  { path: "/magasinier/stock",            element: A(MAGASINIER, WarehouseStockPage)    },
  { path: "/magasinier/arrivage",         element: A(MAGASINIER, WarehouseArrivagePage) },
  { path: "/magasinier/transferts",       element: A(MAGASINIER, WarehouseTransferPage) },
  { path: "/magasinier/transferts/new",   element: A(MAGASINIER, WarehouseTransferPage) },
]);

