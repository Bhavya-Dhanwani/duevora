import { useState } from "react";
import { useNavigate } from "react-router";
import BackgroundGrid from "./BackgroundGrid";
import BlueprintDecorations from "./BlueprintDecorations";
import InvoiceHeader from "./InvoiceHeader";
import Divider from "./Divider";
import WelcomeSection from "./WelcomeSection";
import BarcodeSection from "./BarcodeSection";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import FooterSection from "./FooterSection";
import ReceiptEdge from "./ReceiptEdge";
import useAuth from "../../../hooks/useAuth";
import styles from "../css/AuthLayout.module.css";

export default function AuthLayout({ initialMode = "login" }) {
  const navigate = useNavigate();
  const { login, signup, loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const switchToLogin = () => navigate("/login");
  const switchToSignup = () => navigate("/register");

  const handleLogin = async (data) => {
    setIsLoading(true);
    await login(data);
    setIsLoading(false);
  };

  const handleSignup = async (data) => {
    setIsLoading(true);
    await signup(data);
    setIsLoading(false);
  };

  const handleGoogleLogin = async (credential) => {
    setIsLoading(true);
    await loginWithGoogle(credential);
    setIsLoading(false);
  };

  return (
    <>
      <BackgroundGrid />
      <BlueprintDecorations />

      <div className={styles.layout}>
        <div className={styles.card}>
          <ReceiptEdge position="top" />

          <InvoiceHeader />
          <Divider />

          <div className={styles.welcomeRow}>
            <WelcomeSection mode={initialMode} />
            <BarcodeSection />
          </div>

          <Divider />

          {initialMode === "login" ? (
            <LoginForm
              onLogin={handleLogin}
              onGoogleLogin={handleGoogleLogin}
              isLoading={isLoading}
              onSwitch={switchToSignup}
            />
          ) : (
            <SignupForm
              onSignup={handleSignup}
              onGoogleLogin={handleGoogleLogin}
              isLoading={isLoading}
              onSwitch={switchToLogin}
            />
          )}

          <Divider />

          <FooterSection />

          <ReceiptEdge position="bottom" />
        </div>
      </div>
    </>
  );
}
