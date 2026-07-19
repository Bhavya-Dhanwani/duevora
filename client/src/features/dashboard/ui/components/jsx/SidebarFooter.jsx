import {
  HiChevronDown,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBell,
  HiOutlineQuestionMarkCircle,
  HiOutlineUserCircle,
  HiPlus,
} from "react-icons/hi2";
import styles from "../css/Sidebar.module.css";

const mobileTools = [
  ["Quick create", HiPlus],
  ["Notifications", HiOutlineBell],
  ["Help center", HiOutlineQuestionMarkCircle],
  ["My profile", HiOutlineUserCircle],
];

function AccountCard({ initials, title, subtitle }) {
  return (
    <button className={styles.accountCard} type="button">
      <span className={styles.accountAvatar}>{initials}</span>
      <span className={styles.accountDetails}>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
      <HiChevronDown aria-hidden="true" />
    </button>
  );
}

export default function SidebarFooter({ onLogout }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.mobileTools}>
        {mobileTools.map(([label, Icon]) => (
          <button key={label} type="button">
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className={styles.divider} />
      <AccountCard initials="DV" subtitle="ORG-DV-2026" title="Duevora Studio" />
      <div className={styles.divider} />
      <AccountCard initials="AK" subtitle="Administrator" title="Arjun Kapoor" />
      <button className={styles.logout} onClick={onLogout} type="button">
        <HiOutlineArrowRightOnRectangle aria-hidden="true" />
        <span>Logout</span>
      </button>
    </footer>
  );
}
