import HomePage from "../../features/landing/pages/HomePage";
import LoginPage from "../../features/auth/pages/LoginPage";
import RegisterPage from "../../features/auth/pages/RegisterPage";
import VerifyEmailPage from "../../features/auth/pages/VerifyEmailPage";
import ForgotPasswordPage from "../../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../../features/auth/pages/ResetPasswordPage";
import OnboardingPage from "../../features/onboarding/ui/pages/OnboardingPage";
import DashboardPage from "../../features/dashboard/pages/DashboardPage";

// Customers
import { CustomerListPage, CustomerCreatePage, CustomerDetailPage, CustomerEditPage } from "../../features/customers/pages";
// Vendors
import { VendorListPage, VendorCreatePage, VendorDetailPage, VendorEditPage } from "../../features/vendors/pages";
// Products
import { ProductListPage, ProductCreatePage, ProductDetailPage, ProductEditPage } from "../../features/products/pages";
// Sales
import QuotationListPage from "../../features/sales/ui/pages/QuotationListPage";
import SalesOrderListPage from "../../features/sales/ui/pages/SalesOrderListPage";
import InvoiceListPage from "../../features/sales/ui/pages/InvoiceListPage";
import DeliveryChallanListPage from "../../features/sales/ui/pages/DeliveryChallanListPage";
// Purchases
import PurchaseOrderListPage from "../../features/purchases/ui/pages/PurchaseOrderListPage";
import PurchaseListPage from "../../features/purchases/ui/pages/PurchaseListPage";
// Accounting
import AccountListPage from "../../features/accounting/ui/pages/AccountListPage";
import JournalEntryListPage from "../../features/accounting/ui/pages/JournalEntryListPage";
// Banking
import BankAccountListPage from "../../features/banking/ui/pages/BankAccountListPage";
// Inventory
import InventoryListPage from "../../features/inventory/ui/pages/InventoryListPage";
import StockMovementListPage from "../../features/inventory/ui/pages/StockMovementListPage";
// Employees
import EmployeeListPage from "../../features/employees/ui/pages/EmployeeListPage";
import UserListPage from "../../features/employees/ui/pages/UserListPage";
// Settings
import SettingsPage from "../../features/settings/ui/pages/SettingsPage";
// Reports
import ReportsPage from "../../features/reports/ui/pages/ReportsPage";
// Audit Logs
import AuditLogListPage from "../../features/auditLogs/ui/pages/AuditLogListPage";
// Notifications
import NotificationListPage from "../../features/notifications/ui/pages/NotificationListPage";

import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import PublicRoute from "../components/routes/PublicRoute";
import ProtectedRoute from "../components/routes/ProtectedRoute";
import OnboardingRoute from "../components/routes/OnboardingRoute";

export const routes = [
  {
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
    ],
  },

  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/register", element: <RegisterPage /> },
          { path: "/forgot-password", element: <ForgotPasswordPage /> },
          { path: "/reset-password/:token", element: <ResetPasswordPage /> },
        ],
      },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/verify-email", element: <VerifyEmailPage /> },
        ],
      },
    ],
  },

  {
    element: <OnboardingRoute />,
    children: [
      { path: "/onboard", element: <OnboardingPage /> },
    ],
  },

  {
    element: <ProtectedRoute requireVerified requireOnboarding />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },

          // Customers (full CRUD)
          { path: "/dashboard/customers", element: <CustomerListPage /> },
          { path: "/dashboard/customers/create", element: <CustomerCreatePage /> },
          { path: "/dashboard/customers/:id", element: <CustomerDetailPage /> },
          { path: "/dashboard/customers/:id/edit", element: <CustomerEditPage /> },

          // Vendors (full CRUD)
          { path: "/dashboard/vendors", element: <VendorListPage /> },
          { path: "/dashboard/vendors/create", element: <VendorCreatePage /> },
          { path: "/dashboard/vendors/:id", element: <VendorDetailPage /> },
          { path: "/dashboard/vendors/:id/edit", element: <VendorEditPage /> },

          // Products (full CRUD)
          { path: "/dashboard/products", element: <ProductListPage /> },
          { path: "/dashboard/products/create", element: <ProductCreatePage /> },
          { path: "/dashboard/products/:id", element: <ProductDetailPage /> },
          { path: "/dashboard/products/:id/edit", element: <ProductEditPage /> },

          // Sales
          { path: "/dashboard/quotations", element: <QuotationListPage /> },
          { path: "/dashboard/sales-orders", element: <SalesOrderListPage /> },
          { path: "/dashboard/invoices", element: <InvoiceListPage /> },
          { path: "/dashboard/delivery-challans", element: <DeliveryChallanListPage /> },

          // Purchases
          { path: "/dashboard/purchase-orders", element: <PurchaseOrderListPage /> },
          { path: "/dashboard/purchases", element: <PurchaseListPage /> },

          // Accounting
          { path: "/dashboard/accounts", element: <AccountListPage /> },
          { path: "/dashboard/journal-entries", element: <JournalEntryListPage /> },

          // Banking
          { path: "/dashboard/bank-accounts", element: <BankAccountListPage /> },

          // Inventory
          { path: "/dashboard/inventory", element: <InventoryListPage /> },
          { path: "/dashboard/stock-movements", element: <StockMovementListPage /> },

          // Employees
          { path: "/dashboard/employees", element: <EmployeeListPage /> },
          { path: "/dashboard/users", element: <UserListPage /> },

          // Settings
          { path: "/dashboard/settings", element: <SettingsPage /> },

          // Reports
          { path: "/dashboard/reports", element: <ReportsPage /> },

          // Audit Logs
          { path: "/dashboard/audit-logs", element: <AuditLogListPage /> },

          // Notifications
          { path: "/dashboard/notifications", element: <NotificationListPage /> },
        ],
      },
    ],
  },
];
