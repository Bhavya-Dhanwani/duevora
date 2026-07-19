import {
  HiOutlineBanknotes,
  HiOutlineBuildingStorefront,
  HiOutlineChartBarSquare,
  HiOutlineCog6Tooth,
  HiOutlineCreditCard,
  HiOutlineDocumentText,
  HiOutlineHome,
  HiOutlineReceiptPercent,
  HiOutlineShoppingBag,
  HiOutlineSquares2X2,
  HiOutlineUserGroup,
  HiOutlineCurrencyDollar,
  HiOutlineArrowTrendingUp,
  HiOutlineClipboardDocumentList,
  HiOutlineTruck,
  HiOutlineBookOpen,
  HiOutlineCubeTransparent,
  HiOutlineUsers,
  HiOutlineShieldCheck,
  HiOutlineBell,
} from "react-icons/hi2";
import logoIcon from "../../../../../assets/logo.png";
import styles from "../css/Sidebar.module.css";
import SidebarFooter from "./SidebarFooter";
import SidebarItem from "./SidebarItem";
import ReceiptEdge from "../../../../auth/ui/components/jsx/ReceiptEdge";
import { useAppSelector } from "../../../../../app/store/hooks";

const navigationItems = [
  { icon: HiOutlineHome, label: "Dashboard", to: "/dashboard", end: true },
  { icon: HiOutlineBanknotes, label: "Customers", to: "/dashboard/customers", permission: "customers.view" },
  { icon: HiOutlineShoppingBag, label: "Vendors", to: "/dashboard/vendors", permission: "vendors.view" },
  { icon: HiOutlineSquares2X2, label: "Products", to: "/dashboard/products", permission: "products.view" },
  { icon: HiOutlineReceiptPercent, label: "Quotations", to: "/dashboard/quotations", permission: "quotations.view" },
  { icon: HiOutlineClipboardDocumentList, label: "Sales Orders", to: "/dashboard/sales-orders", permission: "salesOrders.view" },
  { icon: HiOutlineDocumentText, label: "Invoices", to: "/dashboard/invoices", permission: "invoices.view" },
  { icon: HiOutlineTruck, label: "Delivery Challans", to: "/dashboard/delivery-challans", permission: "deliveryChallans.view" },
  { icon: HiOutlineCreditCard, label: "Purchases", to: "/dashboard/purchases", permission: "purchases.view" },
  { icon: HiOutlineShoppingBag, label: "Purchase Orders", to: "/dashboard/purchase-orders", permission: "purchaseOrders.view" },
  { icon: HiOutlineCurrencyDollar, label: "Accounts", to: "/dashboard/accounts", permission: "accounts.view" },
  { icon: HiOutlineBookOpen, label: "Journal Entries", to: "/dashboard/journal-entries", permission: "journalEntries.view" },
  { icon: HiOutlineClipboardDocumentList, label: "Voucher Types", to: "/dashboard/voucher-types", permission: "voucherTypes.view" },
  { icon: HiOutlineCreditCard, label: "Banking", to: "/dashboard/bank-accounts" },
  { icon: HiOutlineBanknotes, label: "Cash Entries", to: "/dashboard/cash-entries" },
  { icon: HiOutlineBuildingStorefront, label: "Inventory", to: "/dashboard/inventory", permission: "inventory.view" },
  { icon: HiOutlineBuildingStorefront, label: "Warehouses", to: "/dashboard/inventory?tab=warehouses", permission: "warehouses.view" },
  { icon: HiOutlineCubeTransparent, label: "Stock Movements", to: "/dashboard/stock-movements", permission: "stockMovements.view" },
  { icon: HiOutlineArrowTrendingUp, label: "Reports", to: "/dashboard/reports", permission: "reports.view" },
  { icon: HiOutlineUserGroup, label: "Employees", to: "/dashboard/employees", permission: "employees.view" },
  { icon: HiOutlineUsers, label: "Users", to: "/dashboard/users", permission: "users.view" },
  { icon: HiOutlineShieldCheck, label: "Audit Logs", to: "/dashboard/audit-logs" },
  { icon: HiOutlineBell, label: "Notifications", to: "/dashboard/notifications" },
  { icon: HiOutlineCog6Tooth, label: "Settings", to: "/dashboard/settings", permission: "roles.view" },
];

export default function Sidebar({ isOpen, onClose, onLogout }) {
  const user = useAppSelector((state) => state.auth.user);
  const permissions = new Set((user?.permissions || []).map((p) => p.toUpperCase()));
  const isAdmin = user?.roles?.includes("ADMIN");
  const visibleNavigationItems = navigationItems.filter((item) => !item.permission || isAdmin || permissions.has(item.permission.toUpperCase()));
  return (
    <aside className={[styles.sidebar, isOpen && styles.open].filter(Boolean).join(" ")}>
      <ReceiptEdge position="top" />
      <div className={styles.inner}>
        <a aria-label="Duevora dashboard home" className={styles.brand} href="/dashboard">
          <img alt="Duevora" className={styles.brandLogo} src={logoIcon} />
          <span className={styles.brandText}>
            <span className={styles.brandName}>DUEVORA</span>
            <span className={styles.brandTag}>Smart Finance . Simplified</span>
          </span>
        </a>
        <div className={styles.divider} />
        <nav aria-label="Dashboard navigation" className={styles.navigation}>
          {visibleNavigationItems.map((item) => (
            <SidebarItem key={item.label} onNavigate={onClose} {...item} />
          ))}
        </nav>
        <SidebarFooter onLogout={onLogout} />
      </div>
      <ReceiptEdge position="bottom" />
    </aside>
  );
}
