import { HiArrowUpRight, HiArrowDownRight } from "react-icons/hi2";
import s from "../css/StatCard.module.css";

export default function StatCard({ label, value, trend, trendLabel }) {
  const isPositive = trend === "up";
  const isNegative = trend === "down";

  // Render mock premium sparklines based on label to match the inspiration design
  const renderSparkline = () => {
    const cleanLabel = label.toLowerCase();
    if (cleanLabel.includes("revenue") || cleanLabel.includes("profit")) {
      return (
        <svg className={s.sparkline} viewBox="0 0 100 30" width="100" height="30">
          <path
            d="M 5 22 Q 20 8, 35 18 T 65 10 T 95 6"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 5 22 Q 20 8, 35 18 T 65 10 T 95 6 L 95 30 L 5 30 Z"
            fill="rgba(15, 98, 254, 0.05)"
          />
        </svg>
      );
    } else if (cleanLabel.includes("expenses")) {
      return (
        <svg className={s.sparkline} viewBox="0 0 100 30" width="100" height="30">
          <path
            d="M 5 6 Q 20 22, 35 10 T 65 24 T 95 18"
            fill="none"
            stroke="#0f172a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 5 6 Q 20 22, 35 10 T 65 24 T 95 18 L 95 30 L 5 30 Z"
            fill="rgba(15, 23, 42, 0.03)"
          />
        </svg>
      );
    } else if (cleanLabel.includes("outstanding")) {
      return (
        <svg className={s.sparkline} viewBox="0 0 60 26" width="60" height="26">
          <rect x="0" y="16" width="5" height="10" rx="1.5" fill="#0f172a" />
          <rect x="10" y="10" width="5" height="16" rx="1.5" fill="#0f172a" />
          <rect x="20" y="14" width="5" height="12" rx="1.5" fill="#0f172a" />
          <rect x="30" y="6" width="5" height="20" rx="1.5" fill="#0f172a" />
          <rect x="40" y="2" width="5" height="24" rx="1.5" fill="#0f172a" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className={s.card}>
      <div className={s.top}>
        <span className={s.label}>{label}</span>
        <span className={s.iconWrap}>
          {isNegative ? <HiArrowDownRight /> : <HiArrowUpRight />}
        </span>
      </div>
      
      <div className={s.middle}>
        <div className={s.value}>{value}</div>
        <div className={s.sparkContainer}>
          {renderSparkline()}
        </div>
      </div>

      <div className={s.bottom}>
        {trendLabel ? (
          <div className={[s.trend, isPositive ? s.positive : s.negative].join(" ")}>
            <span>{isPositive ? "↑" : "↓"}</span>
            <span>{trendLabel}</span>
          </div>
        ) : (
          <div className={s.trendMuted}>
            <span className={s.redDot}>●</span> {trendLabel || "No trend data"}
          </div>
        )}
      </div>
    </div>
  );
}
