import TransactionDocumentPage from "../components/TransactionDocumentPage";
import { salesApi } from "../../api/salesApi";

export default function QuotationListPage() {
  return (
    <TransactionDocumentPage
      title="Quotations"
      subtitle="Prepare customer proposals and keep them ready for approval."
      kind="quotation"
      create={salesApi.createQuotation}
      exportConfig={{
        title: "Quotations",
        filename: "quotations",
        columns: [
          { key: "quotationNumber", label: "Quotation #" },
          { key: "partyName", label: "Customer" },
          { key: "quotationDate", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" },
          { key: "grandTotal", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` },
          { key: "status", label: "Status", render: (v) => (v || "draft").toUpperCase() },
        ],
      }}
    />
  );
}
