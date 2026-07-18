import { useState, useEffect, useCallback } from "react";
import { MdArrowForward } from "react-icons/md";
import styles from "../css/VerifyEmailForm.module.css";
import VerificationCode from "./VerificationCode";

export default function VerifyEmailForm({ onVerify, onResend, isLoading }) {
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(45);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (seconds <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const handleResend = useCallback(() => {
    if (!canResend) return;
    setSeconds(45);
    setCanResend(false);
    onResend?.();
  }, [canResend, onResend]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.length === 6) onVerify(code);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.label}>ENTER VERIFICATION CODE</p>

      <VerificationCode value={code} onChange={setCode} />

      <button
        type="submit"
        className="button-primary"
        disabled={isLoading || code.length < 6}
        style={{
          width: "100%",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          background: "var(--color-primary)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius-md)",
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: "uppercase",
          fontFamily: "var(--font-family)",
          cursor: isLoading || code.length < 6 ? "not-allowed" : "pointer",
          opacity: isLoading || code.length < 6 ? 0.6 : 1,
          transition: "background-color var(--transition-fast)",
        }}
      >
        <span>{isLoading ? "VERIFYING..." : "VERIFY EMAIL"}</span>
        {!isLoading && <MdArrowForward />}
      </button>

      <p className={styles.resend}>
        Didn&apos;t receive the code?{" "}
        {canResend ? (
          <button type="button" className={styles.resendLink} onClick={handleResend}>
            Resend
          </button>
        ) : (
          <span>Resend in {formatTime(seconds)}</span>
        )}
      </p>
    </form>
  );
}
