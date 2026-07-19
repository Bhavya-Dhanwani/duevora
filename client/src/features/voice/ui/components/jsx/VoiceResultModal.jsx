import { HiCheckCircle, HiExclamationCircle, HiOutlineDocumentText, HiOutlineShoppingCart } from "react-icons/hi2";
import { useNavigate } from "react-router";
import s from "../css/VoiceResultModal.module.css";

export default function VoiceResultModal({ result, onClose }) {
  const navigate = useNavigate();

  const isSuccess = result.action === "invoice_created" || result.action === "purchase_created";
  const isInvoice = result.action === "invoice_created";
  const isMessage = result.action === "message";

  const goToDocument = () => {
    if (isInvoice && result.data?._id) {
      navigate(`/dashboard/invoices`);
    } else if (result.action === "purchase_created" && result.data?._id) {
      navigate(`/dashboard/purchases`);
    }
    onClose();
  };

  return (
    <div className={s.result}>
      <div className={`${s.icon} ${isSuccess ? s.success : s.info}`}>
        {isSuccess ? <HiCheckCircle /> : <HiExclamationCircle />}
      </div>

      <p className={s.title}>
        {isSuccess
          ? `${isInvoice ? "Invoice" : "Purchase"} Created`
          : "AI Response"}
      </p>

      {result.transcript && (
        <p className={s.message} style={{ fontStyle: "italic", color: "#64748b", textAlign: "center" }}>
          You said: "{result.transcript}"
        </p>
      )}

      {result.confirmation && (
        <p className={s.confirmation}>{result.confirmation}</p>
      )}

      {result.message && (
        <p className={s.message}>{result.message}</p>
      )}

      {isSuccess && result.data && (
        <div className={s.details}>
          <div className={s.detailRow}>
            <span className={s.detailLabel}>{isInvoice ? "Invoice #" : "Purchase #"}</span>
            <span className={s.detailValue}>{isInvoice ? result.data.invoiceNumber : result.data.purchaseNumber}</span>
          </div>
          <div className={s.detailRow}>
            <span className={s.detailLabel}>{isInvoice ? "Customer" : "Vendor"}</span>
            <span className={s.detailValue}>{isInvoice ? result.data.customer : result.data.vendor}</span>
          </div>
          <div className={s.detailRow}>
            <span className={s.detailLabel}>Total</span>
            <span className={s.detailValue}>${Number(result.data.grandTotal).toFixed(2)}</span>
          </div>
          {result.data.items && (
            <div className={s.items}>
              {result.data.items.map((item, i) => (
                <div key={i} className={s.item}>
                  <span>{item.productName}</span>
                  <span>×{item.quantity} @ ${item.unitPrice}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={s.actions}>
        {isSuccess && (
          <button className={s.viewBtn} onClick={goToDocument} type="button">
            {isInvoice ? <HiOutlineDocumentText /> : <HiOutlineShoppingCart />}
            View {isInvoice ? "Invoices" : "Purchases"}
          </button>
        )}
        <button className={s.doneBtn} onClick={onClose} type="button">
          Done
        </button>
      </div>
    </div>
  );
}
