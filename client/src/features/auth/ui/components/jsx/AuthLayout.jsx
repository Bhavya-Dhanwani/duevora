import { useState, useEffect } from "react";
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
import useNotification from "../../../../../app/components/notification/useNotification";
import styles from "../css/AuthLayout.module.css";

export default function AuthLayout({ initialMode = "login" }) {
  const navigate = useNavigate();
  const { login, signup, restoreSession } = useAuth();
  const { success } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  const switchToLogin = () => navigate("/login");
  const switchToSignup = () => navigate("/register");

  useEffect(() => {
    const channel = new BroadcastChannel("google-auth");
    channel.onmessage = async (e) => {
      if (e.data?.type !== "google-auth-success") return;
      channel.close();
      const result = await restoreSession();
      if (result?.success) {
        success("Logged in with Google successfully");
        navigate("/dashboard", { replace: true });
      }
    };
    return () => channel.close();
  }, [restoreSession, navigate, success]);

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
