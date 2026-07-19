import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiPlus, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import { exportToPdf } from "../../../../lib/exportToPdf";
import { accountingApi } from "../../api/accountingApi";
import { Button, DataTable, Modal, PageHeader, EmptyState } from "../../../../app/components/common";
import useNotification from "../../../../app/components/notification/useNotification";

const emptyForm = { name: "", amount: "", accountId: "", startDate: "", endDate: "", description: "" };
const field = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid #cbd5e1", borderRadius: 7 };

export default function BudgetListPage() {
  const qc = useQueryClient();
  const notify = useNotification();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({ queryKey: ["budgets"], queryFn: () => accountingApi.listBudgets() });
  const items = data?.data || [];

  const accountsQuery = useQuery({ queryKey: ["accounts"], queryFn: () => accountingApi.listAccounts(), enabled: open });
  const accounts = accountsQuery.data?.data || [];

  const create = useMutation({
    mutationFn: accountingApi.createBudget,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      setOpen(false);
      setForm(emptyForm);
      notify.success("Budget created");
    },
    onError: (err) => notify.error(err.response?.data?.message || "Failed"),
  });

  const submit = (e) => {
    e.preventDefault();
    create.mutate({
      name: form.name,
      amount: Number(form.amount),
      accountId: form.accountId || undefined,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      description: form.description,
    });
  };

  const formatAmt = (v) =>
    v != null ? `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0.00";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <PageHeader title="Budgets" subtitle="Plan and track budgets for accounts." />
        <Button variant="primary" onClick={() => setOpen(true)} icon={HiPlus}>
          Create budget
        </Button>
        <Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "Budgets", columns: [{key:"name",label:"Name"},{key:"amount",label:"Amount"},{key:"accountId",label:"Account",render:(v)=>v?.name||"—"},{key:"startDate",label:"Start",render:(v)=>v?new Date(v).toLocaleDateString("en-IN"):"—"},{key:"endDate",label:"End",render:(v)=>v?new Date(v).toLocaleDateString("en-IN"):"—"}], data: items, filename: "budgets" })}>
          Export PDF
        </Button>
      </div>

      <DataTable
        loading={isLoading}
        data={items}
        columns={[
          { key: "name", label: "Name" },
          { key: "amount", label: "Amount", align: "right", render: (v) => formatAmt(v) },
          { key: "accountId", label: "Account", render: (v) => v?.name || "—" },
          { key: "startDate", label: "Start", render: (v) => (v ? new Date(v).toLocaleDateString("en-IN") : "—") },
          { key: "endDate", label: "End", render: (v) => (v ? new Date(v).toLocaleDateString("en-IN") : "—") },
          { key: "status", label: "Status", render: (v) => v || "active" },
        ]}
        emptyTitle="No budgets"
        emptyDescription="Create your first budget."
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create budget">
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <label>
            Name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={field} />
          </label>
          <label>
            Amount
            <input required type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={field} />
          </label>
          <label>
            Account (optional)
            <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} style={field}>
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>{a.code} — {a.name}</option>
              ))}
            </select>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              Start Date
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={field} />
            </label>
            <label>
              End Date
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={field} />
            </label>
          </div>
          <label>
            Description
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={field} />
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
