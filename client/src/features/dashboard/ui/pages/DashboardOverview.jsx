import s from "../components/css/MainContent.module.css";
const a = [
  "Revenue card",
  "Cashflow chart",
  "Quick actions",
  "Expenses",
  "Recent activity",
  "Financial snapshot",
];
export default function DashboardOverview() {
  return (
    <section className={s.overview}>
      <p>WORKSPACE OVERVIEW</p>
      <h1>Overview</h1>
      <span>Your finance workspace is ready for its first widgets.</span>
      <div className={s.grid}>
        {a.map((x) => (
          <div className={s.slot} key={x}>
            {x}
            <small>Coming soon</small>
          </div>
        ))}
      </div>
    </section>
  );
}
