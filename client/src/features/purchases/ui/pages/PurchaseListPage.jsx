import TransactionDocumentPage from "../../../sales/ui/components/TransactionDocumentPage";
import { purchasesApi } from "../../api/purchasesApi";

export default function PurchaseListPage() {
  return (
    <TransactionDocumentPage
      title="Vendor Bills"
      subtitle="Record itemized supplier bills ready for approval."
      party="vendor"
      kind="purchase"
      create={purchasesApi.create}
      exportConfig={{
        title: "Vendor Bills",
        filename: "vendor-bills",
        columns: [
          { key: "purchaseNumber", label: "Purchase #" },
          { key: "partyName", label: "Vendor" },
          { key: "purchaseDate", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" },
          { key: "grandTotal", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` },
          { key: "status", label: "Status", render: (v) => (v || "draft").toUpperCase() },
        ],
      }}
    />
  );
}
