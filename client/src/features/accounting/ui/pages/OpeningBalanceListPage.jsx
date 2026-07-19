import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiPlus, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import { exportToPdf } from "../../../../lib/exportToPdf";
import { accountingApi } from "../../api/accountingApi";
import { Button, DataTable, Modal, PageHeader, EmptyState } from "../../../../app/components/common";
import useNotification from "../../../../app/components/notification/useNotification";

const emptyForm = { accountId: "", debit: "", credit: "", date: new Date().toISOString().slice(0, 10) };
const field = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid #cbd5e1", borderRadius: 7 };

export default function OpeningBalanceListPage() {
  const qc = useQueryClient();
  const notify = useNotification();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["openingBalances"],
    queryFn: () => accountingApi.listOpeningBalances(),
  });
  const items = data?.data || [];

  const accountsQuery = useQuery({ queryKey: ["accounts"], queryFn: () => accountingApi.listAccounts(), enabled: open });
  const accounts = accountsQuery.data?.data || [];

  const create = useMutation({
    mutationFn: accountingApi.createOpeningBalance,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["openingBalances"] });
      setOpen(false);
      setForm(emptyForm);
      notify.success("Opening balance created");
    },
    onError: (err) => notify.error(err.response?.data?.message || "Failed"),
  });

  const submit = (e) => {
    e.preventDefault();
    create.mutate({
      accountId: form.accountId,
      debit: Number(form.debit || 0),
      credit: Number(form.credit || 0),
      date: new Date(form.date).toISOString(),
    });
  };

  const formatAmt = (v) =>
    v != null ? `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0.00";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <PageHeader title="Opening Balances" subtitle="Set opening balances for accounts at the start of a financial year." />
        <Button variant="primary" onClick={() => setOpen(true)} icon={HiPlus}>
          Create opening balance
        </Button>
        <Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "Opening Balances", columns: [{key:"accountId",label:"Account",render:(v)=>v?.name||"—"},{key:"debit",label:"Debit"},{key:"credit",label:"Credit"},{key:"date",label:"Date",render:(v)=>v?new Date(v).toLocaleDateString("en-IN"):"—"}], data: items, filename: "opening-balances" })}>
          Export PDF
        </Button>
      </div>

      <DataTable
        loading={isLoading}
        data={items}
        columns={[
          { key: "accountId", label: "Account", render: (v) => v?.name || v || "—" },
          { key: "debit", label: "Debit", align: "right", render: (v) => formatAmt(v) },
          { key: "credit", label: "Credit", align: "right", render: (v) => formatAmt(v) },
          { key: "date", label: "Date", render: (v) => (v ? new Date(v).toLocaleDateString("en-IN") : "—") },
          { key: "status", label: "Status", render: (v) => v || "—" },
        ]}
        emptyTitle="No opening balances"
        emptyDescription="Create an opening balance to start."
      />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create opening balance">
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <label>
            Account
            <select required value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} style={field}>
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>{a.code} — {a.name}</option>
              ))}
            </select>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              Debit
              <input type="number" min="0" step="0.01" value={form.debit} onChange={(e) => setForm({ ...form, debit: e.target.value })} style={field} />
            </label>
            <label>
              Credit
              <input type="number" min="0" step="0.01" value={form.credit} onChange={(e) => setForm({ ...form, credit: e.target.value })} style={field} />
            </label>
          </div>
          <label>
            Date
            <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={field} />
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
