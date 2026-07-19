import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiPlus, HiCheck, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import { inventoryApi } from "../../api/inventoryApi";
import { Button, DataTable, Modal, PageHeader, StatusBadge } from "../../../../app/components/common";
import useNotification from "../../../../app/components/notification/useNotification";
import { exportToPdf } from "../../../../lib/exportToPdf";

const emptyForm = { productId: "", quantity: "", reason: "", warehouseId: "" };
const field = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid #cbd5e1", borderRadius: 7 };

const statusColor = (s) => {
  if (s === "approved") return { bg: "#dcfce7", color: "#166534" };
  if (s === "rejected") return { bg: "#fee2e2", color: "#991b1b" };
  return { bg: "#fff7ed", color: "#9a3412" };
};

export default function StockAdjustmentListPage() {
  const qc = useQueryClient();
  const notify = useNotification();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({ queryKey: ["stockAdjustments"], queryFn: () => inventoryApi.listStockAdjustments() });
  const items = data?.data || [];

  const approve = useMutation({
    mutationFn: (id) => inventoryApi.approveStockAdjustment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stockAdjustments"] });
      notify.success("Adjustment approved");
    },
    onError: (err) => notify.error(err.response?.data?.message || "Failed to approve"),
  });

  const create = useMutation({
    mutationFn: inventoryApi.createStockAdjustment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stockAdjustments"] });
      setOpen(false);
      setForm(emptyForm);
      notify.success("Adjustment created");
    },
    onError: (err) => notify.error(err.response?.data?.message || "Failed"),
  });

  const submit = (e) => {
    e.preventDefault();
    create.mutate({
      productId: form.productId,
      quantity: Number(form.quantity),
      reason: form.reason,
      warehouseId: form.warehouseId || undefined,
    });
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <PageHeader title="Stock Adjustments" subtitle="Adjust inventory quantities and approve changes." />
        <Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "Stock Adjustments", filename: "stock_adjustments", columns: [{ key: "reference", label: "Reference" }, { key: "productId", label: "Product", render: (v) => v?.name || "—" }, { key: "quantity", label: "Quantity" }, { key: "reason", label: "Reason" }, { key: "status", label: "Status" }, { key: "createdAt", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" }], data: items })}>
          Export PDF
        </Button>
        <Button variant="primary" onClick={() => setOpen(true)} icon={HiPlus}>
          Create adjustment
        </Button>
      </div>

      <DataTable
        loading={isLoading}
        data={items}
        columns={[
          { key: "reference", label: "Reference", render: (v) => v || "—" },
          { key: "productId", label: "Product", render: (v) => v?.name || v || "—" },
          { key: "quantity", label: "Quantity", align: "right" },
          { key: "reason", label: "Reason", render: (v) => v || "—" },
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
        emptyTitle="No stock adjustments"
        emptyDescription="Create an adjustment to start."
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create stock adjustment">
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <label>
            Product ID
            <input required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} style={field} />
          </label>
          <label>
            Quantity
            <input required type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={field} />
          </label>
          <label>
            Reason
            <input required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} style={field} />
          </label>
          <label>
            Warehouse ID (optional)
            <input value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} style={field} />
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
