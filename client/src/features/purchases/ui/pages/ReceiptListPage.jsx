import { useQuery } from "@tanstack/react-query";
import { receiptsApi } from "../../api/purchasesApi";
import { PageHeader, DataTable, StatusBadge, Button } from "../../../../app/components/common";
import { exportToPdf } from "../../../../lib/exportToPdf";
import { HiOutlineDocumentArrowDown } from "react-icons/hi2";

export default function ReceiptListPage() {
  const { data: resp, isLoading } = useQuery({
    queryKey: ["receipts"],
    queryFn: () => receiptsApi.list(),
  });
  const receipts = resp?.data || [];

  const columns = [
    { key: "receiptNumber", label: "Receipt #" },
    { key: "customerName", label: "Customer", render: (_, row) => row.customerName || row.customerId?.name || "—" },
    {
      key: "amount",
      label: "Amount",
      render: (val) => <span style={{ color: "#16a34a", fontWeight: 600 }}>₹{Number(val || 0).toLocaleString("en-IN")}</span>,
    },
    { key: "receiptDate", label: "Date", render: (val) => val ? new Date(val).toLocaleDateString("en-IN") : "—" },
    { key: "paymentMethod", label: "Method", render: (val) => (val || "—").toUpperCase() },
    { key: "status", label: "Status", render: (val) => <StatusBadge status={val === "completed" ? "active" : "pending"}>{(val || "pending").toUpperCase()}</StatusBadge> },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <PageHeader title="Receipts" subtitle="All customer receipts recorded." />
        <Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "Receipts", filename: "receipts", columns: [{ key: "receiptNumber", label: "Receipt #" }, { key: "customerName", label: "Customer", render: (v, row) => row.customerName || row.customerId?.name || "—" }, { key: "amount", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` }, { key: "receiptDate", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" }, { key: "paymentMethod", label: "Method", render: (v) => (v || "—").toUpperCase() }, { key: "status", label: "Status", render: (v) => (v || "pending").toUpperCase() }], data: receipts })}>
          Export PDF
        </Button>
      </div>
      <DataTable columns={columns} data={receipts} loading={isLoading} emptyTitle="No receipts" emptyDescription="Receipts will appear here once recorded." />
    </div>
  );
}
