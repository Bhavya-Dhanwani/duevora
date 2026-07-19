import s from "../css/Tabs.module.css";

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className={s.tabs} role="tablist">
      {tabs.map((tab) => (
        <button
          className={[s.tab, tab.key === active && s.active].filter(Boolean).join(" ")}
          key={tab.key}
          onClick={() => onChange(tab.key)}
          role="tab"
          type="button"
        >
          {tab.label}
          {tab.count !== undefined && <span className={s.count}>{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
