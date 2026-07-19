import { NavLink } from "react-router";
import styles from "../css/Sidebar.module.css";

export default function SidebarItem({ icon: Icon, label, to, onNavigate }) {
  return (
    <NavLink
      className={({ isActive }) =>
        [styles.navigationItem, isActive && styles.active].filter(Boolean).join(" ")
      }
      onClick={onNavigate}
      to={to}
    >
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );
}
