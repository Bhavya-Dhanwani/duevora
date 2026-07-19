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
} from "react-icons/hi2";
import ReceiptEdge from "../../../../auth/ui/components/jsx/ReceiptEdge";
import logoIcon from "../../../../../assets/logo.png";
import styles from "../css/Sidebar.module.css";
import SidebarFooter from "./SidebarFooter";
import SidebarItem from "./SidebarItem";

const navigationItems = [
  { icon: HiOutlineHome, label: "Dashboard", to: "/dashboard" },
  { icon: HiOutlineReceiptPercent, label: "Transactions", to: "/dashboard/transactions" },
  { icon: HiOutlineBanknotes, label: "Sales", to: "/dashboard/sales" },
  { icon: HiOutlineShoppingBag, label: "Purchases", to: "/dashboard/purchases" },
  { icon: HiOutlineDocumentText, label: "Invoices", to: "/dashboard/invoices" },
  { icon: HiOutlineCreditCard, label: "Expenses", to: "/dashboard/expenses" },
  { icon: HiOutlineBuildingStorefront, label: "Banking", to: "/dashboard/banking" },
  { icon: HiOutlineChartBarSquare, label: "Reports", to: "/dashboard/reports" },
  { icon: HiOutlineUserGroup, label: "Employees", to: "/dashboard/employees" },
  { icon: HiOutlineSquares2X2, label: "Inventory", to: "/dashboard/inventory" },
  { icon: HiOutlineCog6Tooth, label: "Settings", to: "/dashboard/settings" },
];

export default function Sidebar({ isOpen, onClose, onLogout }) {
  return (
    <aside className={[styles.sidebar, isOpen && styles.open].filter(Boolean).join(" ")}>
      <ReceiptEdge position="top" />
      <div className={styles.inner}>
        <a aria-label="Duevora dashboard home" className={styles.brand} href="/dashboard">
          <img alt="Duevora" className={styles.brandLogo} src={logoIcon} />
          <span>
            {" "}
            DUEVORA <small>SMART FINANCE. SIMPLIFIED.</small>
          </span>
        </a>
        <div className={styles.divider} />
        <nav aria-label="Dashboard navigation" className={styles.navigation}>
          {navigationItems.map((item) => (
            <SidebarItem key={item.label} onNavigate={onClose} {...item} />
          ))}
        </nav>
        <SidebarFooter onLogout={onLogout} />
      </div>
      <ReceiptEdge position="bottom" />
    </aside>
  );
}
