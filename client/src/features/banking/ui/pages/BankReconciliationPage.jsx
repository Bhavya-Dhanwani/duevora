import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bankingApi } from "../../api/bankingApi";
import { PageHeader, Button, DataTable, StatusBadge, Modal } from "../../../../app/components/common";
import useNotification from "../../../../app/components/notification/useNotification";
import { exportToPdf } from "../../../../lib/exportToPdf";
import { HiOutlineDocumentArrowDown } from "react-icons/hi2";

const input = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 5, padding: 9, border: "1px solid #cbd5e1", borderRadius: 7 };

export default function BankReconciliationPage() {
  const queryClient = useQueryClient();
  const { success, error: notifyError } = useNotification();
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [form, setForm] = useState({ bankAccountId: "", statementDate: new Date().toISOString().slice(0, 10), closingBalance: "", notes: "" });

  const { data: bankAccountsResp } = useQuery({
    queryKey: ["bankAccounts"],
    queryFn: () => bankingApi.listBankAccounts(),
  });
  const bankAccounts = bankAccountsResp?.data || [];

  const { data: txResp, isLoading } = useQuery({
    queryKey: ["bankTransactions"],
    queryFn: () => bankingApi.listBankTransactions(),
  });
  const transactions = txResp?.data || [];

  const reconcile = useMutation({
    mutationFn: (data) => bankingApi.reconcile(data),
    onSuccess: () => {
      setIsReconcileOpen(false);
      setForm({ bankAccountId: "", statementDate: new Date().toISOString().slice(0, 10), closingBalance: "", notes: "" });
      success("Bank reconciliation completed");
    },
    onError: (err) => notifyError(err.response?.data?.message || "Reconciliation failed"),
  });

  const columns = [
    {
      key: "bankAccount",
      label: "Bank Account",
      render: (_, row) => {
        const ba = bankAccounts.find((b) => b._id === row.bankAccountId);
        return ba ? `${ba.bankName} (${ba.accountNumber})` : "—";
      },
    },
    { key: "transactionDate", label: "Date", render: (val) => val ? new Date(val).toLocaleDateString("en-IN") : "—" },
    {
      key: "type",
      label: "Type",
      render: (val) => <StatusBadge status={val === "credit" ? "active" : "error"}>{(val || "—").toUpperCase()}</StatusBadge>,
    },
    {
      key: "amount",
      label: "Amount",
      render: (val, row) => {
        const prefix = row.type === "credit" ? "+" : "-";
        return <span style={{ color: row.type === "credit" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{prefix}₹{Number(val || 0).toLocaleString("en-IN")}</span>;
      },
    },
    { key: "reference", label: "Reference", render: (val) => val || "—" },
  ];

  const totalCredit = transactions.filter((t) => t.type === "credit").reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalDebit = transactions.filter((t) => t.type === "debit").reduce((s, t) => s + Number(t.amount || 0), 0);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        title="Bank Reconciliation"
        subtitle="Compare your bank statement with recorded transactions."
        action={<div style={{ display: "flex", gap: 10 }}><Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "Bank Reconciliation", filename: "bank-reconciliation", columns: [{ key: "bankAccount", label: "Bank Account", render: (_, row) => { const ba = bankAccounts.find((b) => b._id === row.bankAccountId); return ba ? `${ba.bankName} (${ba.accountNumber})` : "—"; } }, { key: "transactionDate", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" }, { key: "type", label: "Type", render: (v) => (v || "—").toUpperCase() }, { key: "amount", label: "Amount", render: (v, row) => `${row.type === "credit" ? "+" : "-"}₹${Number(v || 0).toLocaleString("en-IN")}` }, { key: "reference", label: "Reference" }], data: transactions })}>Export PDF</Button><Button variant="primary" onClick={() => setIsReconcileOpen(true)}>Reconcile</Button></div>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          ["Total Credits", `₹${totalCredit.toLocaleString("en-IN")}`, "#16a34a"],
          ["Total Debits", `₹${totalDebit.toLocaleString("en-IN")}`, "#dc2626"],
          ["Net", `₹${(totalCredit - totalDebit).toLocaleString("en-IN")}`, totalCredit - totalDebit >= 0 ? "#16a34a" : "#dc2626"],
        ].map(([label, value, color]) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={transactions} loading={isLoading} emptyTitle="No transactions" emptyDescription="Record bank transactions to start reconciliation." />

      <Modal isOpen={isReconcileOpen} onClose={() => setIsReconcileOpen(false)} title="Bank Reconciliation">
        <form onSubmit={(e) => { e.preventDefault(); reconcile.mutate({ ...form, closingBalance: Number(form.closingBalance) }); }} style={{ display: "grid", gap: 14 }}>
          <label>Bank Account<select required value={form.bankAccountId} onChange={(e) => setForm({ ...form, bankAccountId: e.target.value })} style={input}><option value="">Select account</option>{bankAccounts.map((ba) => <option key={ba._id} value={ba._id}>{ba.bankName} — {ba.accountNumber}</option>)}</select></label>
          <label>Statement Date<input required type="date" value={form.statementDate} onChange={(e) => setForm({ ...form, statementDate: e.target.value })} style={input} /></label>
          <label>Closing Balance<input required type="number" step="0.01" value={form.closingBalance} onChange={(e) => setForm({ ...form, closingBalance: e.target.value })} style={input} /></label>
          <label>Notes<textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={input} /></label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <Button type="button" variant="secondary" onClick={() => setIsReconcileOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={reconcile.isPending}>Reconcile</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
