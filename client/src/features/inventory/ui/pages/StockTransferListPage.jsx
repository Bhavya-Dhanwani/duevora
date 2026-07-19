import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiPlus, HiCheck, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import { inventoryApi } from "../../api/inventoryApi";
import { Button, DataTable, Modal, PageHeader } from "../../../../app/components/common";
import useNotification from "../../../../app/components/notification/useNotification";
import { exportToPdf } from "../../../../lib/exportToPdf";

const emptyForm = { productId: "", fromWarehouseId: "", toWarehouseId: "", quantity: "" };
const field = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid #cbd5e1", borderRadius: 7 };

const statusColor = (s) => {
  if (s === "approved") return { bg: "#dcfce7", color: "#166534" };
  if (s === "rejected") return { bg: "#fee2e2", color: "#991b1b" };
  return { bg: "#fff7ed", color: "#9a3412" };
};

export default function StockTransferListPage() {
  const qc = useQueryClient();
  const notify = useNotification();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({ queryKey: ["stockTransfers"], queryFn: () => inventoryApi.listStockTransfers() });
  const items = data?.data || [];

  const approve = useMutation({
    mutationFn: (id) => inventoryApi.approveStockTransfer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stockTransfers"] });
      notify.success("Transfer approved");
    },
    onError: (err) => notify.error(err.response?.data?.message || "Failed to approve"),
  });

  const create = useMutation({
    mutationFn: inventoryApi.createStockTransfer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stockTransfers"] });
      setOpen(false);
      setForm(emptyForm);
      notify.success("Transfer created");
    },
    onError: (err) => notify.error(err.response?.data?.message || "Failed"),
  });

  const submit = (e) => {
    e.preventDefault();
    create.mutate({
      productId: form.productId,
      fromWarehouseId: form.fromWarehouseId,
      toWarehouseId: form.toWarehouseId,
      quantity: Number(form.quantity),
    });
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <PageHeader title="Stock Transfers" subtitle="Transfer inventory between warehouses and approve." />
        <Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "Stock Transfers", filename: "stock_transfers", columns: [{ key: "reference", label: "Reference" }, { key: "productId", label: "Product", render: (v) => v?.name || "—" }, { key: "fromWarehouseId", label: "From", render: (v) => v?.name || "—" }, { key: "toWarehouseId", label: "To", render: (v) => v?.name || "—" }, { key: "quantity", label: "Quantity" }, { key: "status", label: "Status" }, { key: "createdAt", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" }], data: items })}>
          Export PDF
        </Button>
        <Button variant="primary" onClick={() => setOpen(true)} icon={HiPlus}>
          Create transfer
        </Button>
      </div>

      <DataTable
        loading={isLoading}
        data={items}
        columns={[
          { key: "reference", label: "Reference", render: (v) => v || "—" },
          { key: "productId", label: "Product", render: (v) => v?.name || v || "—" },
          { key: "fromWarehouseId", label: "From", render: (v) => v?.name || v || "—" },
          { key: "toWarehouseId", label: "To", render: (v) => v?.name || v || "—" },
          { key: "quantity", label: "Quantity", align: "right" },
          {
            key: "status",
            label: "Status",
            render: (v) => {
              const c = statusColor(v);
              return (
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: c.bg, color: c.color }}>
                  {v || "pending"}
                </span>
              );
            },
          },
          { key: "createdAt", label: "Date", render: (v) => (v ? new Date(v).toLocaleDateString("en-IN") : "—") },
          {
            key: "_id",
            label: "Action",
            render: (v, row) =>
              (row.status || "pending") === "pending" ? (
                <button
                  onClick={(e) => { e.stopPropagation(); approve.mutate(v); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", border: "1px solid #bbf7d0", background: "#dcfce7", color: "#166534", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  <HiCheck size={14} />Approve
                </button>
              ) : null,
          },
        ]}
        emptyTitle="No stock transfers"
        emptyDescription="Create a transfer to start."
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create stock transfer">
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <label>
            Product ID
            <input required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} style={field} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              From Warehouse ID
              <input required value={form.fromWarehouseId} onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })} style={field} />
            </label>
            <label>
              To Warehouse ID
              <input required value={form.toWarehouseId} onChange={(e) => setForm({ ...form, toWarehouseId: e.target.value })} style={field} />
            </label>
          </div>
          <label>
            Quantity
            <input required type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={field} />
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={create.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
