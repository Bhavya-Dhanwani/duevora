import s from "../css/Select.module.css";

export default function Select({ value, onChange, options, placeholder, className = "" }) {
  return (
    <select
      className={[s.select, className].filter(Boolean).join(" ")}
      onChange={onChange}
      value={value}
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
