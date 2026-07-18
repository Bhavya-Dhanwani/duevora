import BackgroundGrid from "./BackgroundGrid";
import BlueprintDecorations from "./BlueprintDecorations";
import InvoiceHeader from "./InvoiceHeader";
import Divider from "./Divider";
import BarcodeSection from "./BarcodeSection";
import ResetPasswordForm from "./ResetPasswordForm";
import FooterSection from "./FooterSection";
import ReceiptEdge from "./ReceiptEdge";
import styles from "../css/AuthLayout.module.css";

export default function ResetPasswordLayout({ token, onSubmit, onBack, isLoading }) {
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
                Reset Password
              </h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                Create a new password for your account. Make sure it&apos;s strong and unique.
              </p>
            </div>
            <BarcodeSection />
          </div>

          <Divider />

          <ResetPasswordForm onSubmit={onSubmit} onBack={onBack} isLoading={isLoading} />

          <Divider />

          <FooterSection />

          <ReceiptEdge position="bottom" />
        </div>
      </div>
    </>
  );
}
