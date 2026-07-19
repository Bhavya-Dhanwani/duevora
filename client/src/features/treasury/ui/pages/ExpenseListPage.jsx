import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountingApi } from "../../../accounting/api/accountingApi";
import { PageHeader, Button, DataTable, Modal } from "../../../../app/components/common";
import useNotification from "../../../../app/components/notification/useNotification";
import { exportToPdf } from "../../../../lib/exportToPdf";
import { HiOutlineDocumentArrowDown } from "react-icons/hi2";

const input = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 5, padding: 9, border: "1px solid #cbd5e1", borderRadius: 7 };

export default function ExpenseListPage() {
  const queryClient = useQueryClient();
  const { success, error: notifyError } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ expenseAccountId: "", bankAccountId: "", amount: "", date: new Date().toISOString().slice(0, 10), description: "" });

  const { data: accountsResp } = useQuery({ queryKey: ["accounts"], queryFn: () => accountingApi.listAccounts() });
  const accounts = accountsResp?.data || [];

  const { data: expensesResp, isLoading } = useQuery({ queryKey: ["expenses"], queryFn: () => accountingApi.listExpenses() });
  const expenses = expensesResp?.data || [];

  const create = useMutation({
    mutationFn: (data) => accountingApi.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["expenses"]);
      setIsOpen(false);
      setForm({ expenseAccountId: "", bankAccountId: "", amount: "", date: new Date().toISOString().slice(0, 10), description: "" });
      success("Expense recorded");
    },
    onError: (err) => notifyError(err.response?.data?.message || "Failed"),
  });

  const columns = [
    { key: "description", label: "Description" },
    {
      key: "amount",
      label: "Amount",
      render: (val) => <span style={{ color: "#dc2626", fontWeight: 600 }}>₹{Number(val || 0).toLocaleString("en-IN")}</span>,
    },
    { key: "date", label: "Date", render: (val) => val ? new Date(val).toLocaleDateString("en-IN") : "—" },
    { key: "createdAt", label: "Recorded", render: (val) => val ? new Date(val).toLocaleDateString("en-IN") : "—" },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader title="Expenses" subtitle="Track all business expenses." action={<div style={{ display: "flex", gap: 10 }}><Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "Expenses", filename: "expenses", columns: [{ key: "description", label: "Description" }, { key: "amount", label: "Amount", render: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` }, { key: "date", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" }, { key: "createdAt", label: "Recorded", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" }], data: expenses })}>Export PDF</Button><Button variant="primary" onClick={() => setIsOpen(true)}>Record Expense</Button></div>} />
      <DataTable columns={columns} data={expenses} loading={isLoading} emptyTitle="No expenses" emptyDescription="Record your first expense to get started." />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Record Expense">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate({ ...form, amount: Number(form.amount) }); }} style={{ display: "grid", gap: 14 }}>
          <label>Expense Account<select required value={form.expenseAccountId} onChange={(e) => setForm({ ...form, expenseAccountId: e.target.value })} style={input}><option value="">Select account</option>{accounts.filter((a) => a.type === "expense").map((a) => <option key={a._id} value={a._id}>{a.code} — {a.name}</option>)}</select></label>
          <label>Bank Account<select required value={form.bankAccountId} onChange={(e) => setForm({ ...form, bankAccountId: e.target.value })} style={input}><option value="">Select bank account</option>{accounts.filter((a) => a.type === "asset").map((a) => <option key={a._id} value={a._id}>{a.code} — {a.name}</option>)}</select></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label>Amount<input required type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={input} /></label>
            <label>Date<input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={input} /></label>
          </div>
          <label>Description<textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={input} /></label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={create.isPending}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
