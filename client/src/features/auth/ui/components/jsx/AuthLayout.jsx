import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
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
  const { login, signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || undefined;

  const switchToLogin = () => {
    const tokenQuery = token ? `?token=${token}` : "";
    navigate(`/login${tokenQuery}`);
  };

  const switchToSignup = () => {
    const tokenQuery = token ? `?token=${token}` : "";
    navigate(`/register${tokenQuery}`);
  };

  const handleLogin = async (data) => {
    setIsLoading(true);
    await login({ ...data, token });
    setIsLoading(false);
  };

  const handleSignup = async (data) => {
    setIsLoading(true);
    await signup({ ...data, token });
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
              isLoading={isLoading}
              onSwitch={switchToSignup}
            />
          ) : (
            <SignupForm
              onSignup={handleSignup}
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
