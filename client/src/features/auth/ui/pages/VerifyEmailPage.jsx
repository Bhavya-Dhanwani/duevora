import { useState } from "react";
import { useLocation } from "react-router";
import VerifyEmailLayout from "../components/jsx/VerifyEmailLayout";
import useAuth from "../../hooks/useAuth";

export default function VerifyEmailPage() {
  const location = useLocation();
  const email = location.state?.email || "your email";
  const { verifyEmail, sendOtp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (code) => {
    setIsLoading(true);
    await verifyEmail(code);
    setIsLoading(false);
  };

  const handleResend = async () => {
    await sendOtp();
  };

  return (
    <VerifyEmailLayout
      email={email}
      onVerify={handleVerify}
      onResend={handleResend}
      isLoading={isLoading}
    />
  );
}
