import { HiArrowTrendingUp, HiArrowTrendingDown } from "react-icons/hi2";
import s from "../css/StatCard.module.css";

export default function StatCard({ label, value, trend, trendLabel, icon: Icon }) {
  const isPositive = trend === "up";
  const isNegative = trend === "down";

  return (
    <div className={s.card}>
      <div className={s.top}>
        <span className={s.label}>{label}</span>
        {Icon && (
          <span className={s.iconWrap}>
            <Icon />
          </span>
        )}
      </div>
      <div className={s.value}>{value}</div>
      {(isPositive || isNegative) && (
        <div className={[s.trend, isPositive ? s.positive : s.negative].join(" ")}>
          {isPositive ? <HiArrowTrendingUp /> : <HiArrowTrendingDown />}
          <span>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
