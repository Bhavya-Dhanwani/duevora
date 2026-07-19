import TransactionDocumentPage from "../../../sales/ui/components/TransactionDocumentPage";
import { purchasesApi } from "../../api/purchasesApi";

export default function PurchaseOrderListPage() {
  return (
    <TransactionDocumentPage
      title="Purchase Orders"
      subtitle="Prepare supplier purchase commitments."
      party="vendor"
      kind="po"
      create={purchasesApi.createPurchaseOrder}
      exportConfig={{
        title: "Purchase Orders",
        filename: "purchase-orders",
        columns: [
          { key: "poNumber", label: "PO #" },
          { key: "partyName", label: "Vendor" },
          { key: "poDate", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" },
          { key: "grandTotal", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` },
          { key: "status", label: "Status", render: (v) => (v || "draft").toUpperCase() },
        ],
      }}
    />
  );
}
