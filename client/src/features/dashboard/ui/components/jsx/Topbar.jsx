import { useState } from "react";
import {
  HiMagnifyingGlass,
  HiPlus,
  HiOutlineBell,
  HiOutlineQuestionMarkCircle,
  HiChevronDown,
  HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";
import s from "../css/Topbar.module.css";
export default function Topbar({ isMenuOpen, onMenuOpen, onLogout }) {
  const [o, setO] = useState(false);
  return (
    <header>
      <button
        className={`${s.menu} ${isMenuOpen ? s.menuOpen : ""}`}
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
        onClick={onMenuOpen}
        type="button"
      >
        <span />
        <span />
        <span />
      </button>
      <label className={s.search}>
        <HiMagnifyingGlass />
        <input placeholder="Search anything..." type="search" />
        <kbd>Ctrl K</kbd>
      </label>
      <div className={s.actions}>
        <button className={s.create} aria-label="Quick create" type="button">
          <HiPlus />
        </button>
        <button aria-label="Notifications" type="button">
          <HiOutlineBell />
        </button>
        <button aria-label="Help" type="button">
          <HiOutlineQuestionMarkCircle />
        </button>
        <div className={s.profileWrap}>
          <button className={s.profile} aria-expanded={o} onClick={() => setO(!o)} type="button">
            <b>AK</b>
            <span>Arjun Kapoor</span>
            <HiChevronDown />
          </button>
          {o && (
            <div className={s.drop} role="menu">
              <button type="button">My Profile</button>
              <button type="button">Settings</button>
              <i />
              <button onClick={onLogout} type="button">
                <HiOutlineArrowRightOnRectangle />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
