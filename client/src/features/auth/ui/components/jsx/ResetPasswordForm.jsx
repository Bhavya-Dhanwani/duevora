import { useState } from "react";
import styles from "../css/ForgotPasswordForm.module.css";
import PasswordField from "./PasswordField";
import LoginButton from "./LoginButton";
import SwitchText from "./SwitchText";

export default function ResetPasswordForm({ onSubmit, onBack, isLoading }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    onSubmit(password);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <PasswordField
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        label="NEW PASSWORD"
        placeholder="Enter new password"
      />

      <PasswordField
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        label="CONFIRM PASSWORD"
        placeholder="Confirm new password"
      />

      {error && (
        <p style={{ fontSize: 13, color: "#ef4444", margin: 0, textAlign: "center" }}>
          {error}
        </p>
      )}

      <LoginButton isLoading={isLoading} text="RESET PASSWORD" />

      <SwitchText
        text="Back to"
        actionText="Login"
        onSwitch={onBack}
      />
    </form>
  );
}
