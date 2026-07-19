import { useEffect, useState } from "react";
import Sidebar from "../components/jsx/Sidebar";
import Topbar from "../components/jsx/Topbar";
import MainContent from "../components/jsx/MainContent";
import LogoutPopup from "../components/jsx/LogoutPopup";
import s from "../components/css/MainContent.module.css";
export default function DashboardLayout() {
  const [m, setM] = useState(false),
    [l, setL] = useState(false);
  useEffect(() => {
    const k = (e) => e.key === "Escape" && setM(false);
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, []);
  return (
    <div className={s.shell}>
      <Sidebar isOpen={m} onClose={() => setM(false)} onLogout={() => setL(true)} />
      {m && (
        <button
          className={s.overlay}
          aria-label="Close navigation"
          onClick={() => setM(false)}
          type="button"
        />
      )}
      <Topbar isMenuOpen={m} onMenuOpen={() => setM(!m)} onLogout={() => setL(true)} />
      <MainContent />
      {l && <LogoutPopup onClose={() => setL(false)} />}
    </div>
  );
}
