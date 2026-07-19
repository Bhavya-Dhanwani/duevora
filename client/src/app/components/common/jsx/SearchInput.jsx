import { useEffect, useRef, useState } from "react";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";
import s from "../css/SearchInput.module.css";

export default function SearchInput({ value = "", onChange, placeholder = "Search...", debounce = 300 }) {
  const [local, setLocal] = useState(value);
  const timer = useRef(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange?.(v), debounce);
  };

  const handleClear = () => {
    setLocal("");
    clearTimeout(timer.current);
    onChange?.("");
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className={s.wrap}>
      <HiMagnifyingGlass className={s.icon} />
      <input
        className={s.input}
        onChange={handleChange}
        placeholder={placeholder}
        type="text"
        value={local}
      />
      {local && (
        <button className={s.clear} onClick={handleClear} type="button">
          <HiXMark />
        </button>
      )}
    </div>
  );
}
