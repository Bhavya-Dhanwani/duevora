import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "../../api/purchasesApi";
import { PageHeader, DataTable, StatusBadge, Button } from "../../../../app/components/common";
import { exportToPdf } from "../../../../lib/exportToPdf";
import { HiOutlineDocumentArrowDown } from "react-icons/hi2";

export default function PaymentListPage() {
  const { data: resp, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: () => paymentsApi.list(),
  });
  const payments = resp?.data || [];

  const columns = [
    { key: "paymentNumber", label: "Payment #" },
    { key: "vendorName", label: "Vendor", render: (_, row) => row.vendorName || row.vendorId?.name || "—" },
    {
      key: "amount",
      label: "Amount",
      render: (val) => <span style={{ color: "#dc2626", fontWeight: 600 }}>₹{Number(val || 0).toLocaleString("en-IN")}</span>,
    },
    { key: "paymentDate", label: "Date", render: (val) => val ? new Date(val).toLocaleDateString("en-IN") : "—" },
    { key: "paymentMethod", label: "Method", render: (val) => (val || "—").toUpperCase() },
    { key: "status", label: "Status", render: (val) => <StatusBadge status={val === "completed" ? "active" : "pending"}>{(val || "pending").toUpperCase()}</StatusBadge> },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <PageHeader title="Payments" subtitle="All vendor payments recorded." />
        <Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "Payments", filename: "payments", columns: [{ key: "paymentNumber", label: "Payment #" }, { key: "vendorName", label: "Vendor", render: (v, row) => row.vendorName || row.vendorId?.name || "—" }, { key: "amount", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` }, { key: "paymentDate", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" }, { key: "paymentMethod", label: "Method", render: (v) => (v || "—").toUpperCase() }, { key: "status", label: "Status", render: (v) => (v || "pending").toUpperCase() }], data: payments })}>
          Export PDF
        </Button>
      </div>
      <DataTable columns={columns} data={payments} loading={isLoading} emptyTitle="No payments" emptyDescription="Payments will appear here once recorded." />
    </div>
  );
}
