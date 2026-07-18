import { useState } from "react";
import styles from "../css/LoginForm.module.css";
import InputField from "./InputField";
import PasswordField from "./PasswordField";
import ForgotPassword from "./ForgotPassword";
import LoginButton from "./LoginButton";
import Separator from "./Separator";
import GoogleButton from "./GoogleButton";
import SwitchText from "./SwitchText";
import { loginSchema } from "../../../api/validation";
import useNotification from "../../../../../app/components/notification/useNotification";

export default function LoginForm({ onLogin, onGoogleLogin, isLoading, onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const { error: showError } = useNotification();

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      showError(result.error.issues[0].message);
      return;
    }
    onLogin({ email, password });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <InputField
        label="EMAIL"
        type="email"
        name="email"
        placeholder="Enter your email"
        icon="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        required
      />

      <PasswordField
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />

      <ForgotPassword />

      <LoginButton isLoading={isLoading} />

      <SwitchText
        text="Don't have an account?"
        actionText="Signup"
        onSwitch={onSwitch}
      />

      <Separator text="OR" />

      <GoogleButton onClick={onGoogleLogin} />
    </form>
  );
}
