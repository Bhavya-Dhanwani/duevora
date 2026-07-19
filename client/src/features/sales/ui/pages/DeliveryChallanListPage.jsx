import TransactionDocumentPage from "../components/TransactionDocumentPage";
import { salesApi } from "../../api/salesApi";

export default function DeliveryChallanListPage() {
  return (
    <TransactionDocumentPage
      title="Delivery Challans"
      subtitle="Record customer deliveries and dispatches."
      kind="challan"
      create={salesApi.createDeliveryChallan}
      exportConfig={{
        title: "Delivery Challans",
        filename: "delivery-challans",
        columns: [
          { key: "challanNumber", label: "Challan #" },
          { key: "partyName", label: "Customer" },
          { key: "challanDate", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" },
          { key: "status", label: "Status", render: (v) => (v || "draft").toUpperCase() },
        ],
      }}
    />
  );
}
