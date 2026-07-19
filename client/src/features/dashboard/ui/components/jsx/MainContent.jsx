import { Outlet } from "react-router";
import s from "../css/MainContent.module.css";
export default function MainContent() {
  return (
    <main className={s.main}>
      <Outlet />
    </main>
  );
}
