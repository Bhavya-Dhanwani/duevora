import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import Modal from "./Modal";
import s from "../css/ConfirmDialog.module.css";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title={title}>
      <div className={s.content}>
        <div className={s.iconWrap}>
          <HiOutlineExclamationTriangle />
        </div>
        <p className={s.message}>{message}</p>
        <div className={s.actions}>
          <button className={s.cancel} disabled={loading} onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className={s.confirm}
            disabled={loading}
            onClick={onConfirm}
            type="button"
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
