import TransactionDocumentPage from "../components/TransactionDocumentPage";
import { salesApi } from "../../api/salesApi";

export default function SalesOrderListPage() {
  return (
    <TransactionDocumentPage
      title="Sales Orders"
      subtitle="Capture confirmed customer commitments."
      kind="order"
      create={salesApi.createSalesOrder}
      exportConfig={{
        title: "Sales Orders",
        filename: "sales-orders",
        columns: [
          { key: "orderNumber", label: "Order #" },
          { key: "partyName", label: "Customer" },
          { key: "orderDate", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" },
          { key: "grandTotal", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` },
          { key: "status", label: "Status", render: (v) => (v || "draft").toUpperCase() },
        ],
      }}
    />
  );
}
