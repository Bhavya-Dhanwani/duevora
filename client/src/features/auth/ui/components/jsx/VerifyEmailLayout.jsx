import BackgroundGrid from "./BackgroundGrid";
import BlueprintDecorations from "./BlueprintDecorations";
import InvoiceHeader from "./InvoiceHeader";
import Divider from "./Divider";
import BarcodeSection from "./BarcodeSection";
import VerifyEmailForm from "./VerifyEmailForm";
import ReceiptEdge from "./ReceiptEdge";
import styles from "../css/AuthLayout.module.css";

export default function VerifyEmailLayout({ email, onVerify, onResend, isLoading }) {
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
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 6 }}>
                BILL TO:
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", margin: "0 0 6px" }}>
                Verify Your Email
              </h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                Enter the 6-digit verification code sent to <strong>{email}</strong>
              </p>
            </div>
            <BarcodeSection />
          </div>

          <Divider />

          <VerifyEmailForm onVerify={onVerify} onResend={onResend} isLoading={isLoading} />

          <Divider />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 24 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
                Need help?
              </p>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5, maxWidth: 280 }}>
                Contact our support team if you&apos;re having trouble verifying your email.
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "var(--color-accent)", margin: "0 0 4px" }}>
                TOTAL
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                Almost There!
              </p>
            </div>
          </div>

          <ReceiptEdge position="bottom" />
        </div>
      </div>
    </>
  );
}
