import TransactionDocumentPage from "../components/TransactionDocumentPage";
import { salesApi } from "../../api/salesApi";

export default function InvoiceListPage() {
  return (
    <TransactionDocumentPage
      title="Invoices"
      subtitle="Create itemized invoices ready to post to the ledger."
      kind="invoice"
      create={salesApi.createInvoice}
      exportConfig={{
        title: "Invoices",
        filename: "invoices",
        columns: [
          { key: "invoiceNumber", label: "Invoice #" },
          { key: "partyName", label: "Customer" },
          { key: "invoiceDate", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" },
          { key: "grandTotal", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` },
          { key: "status", label: "Status", render: (v) => (v || "draft").toUpperCase() },
        ],
      }}
    />
  );
}
